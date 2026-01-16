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
  { label: "Active" },
  { label: "Follow Up" },
  { label: "Inactive" },
  { label: "Onboard" },
];

/* ---------------- NORMALIZE LEAD ---------------- */
const normalizeLead = (lead) => {
  const obj = {
    id: lead.id,
    created_time: lead.created_time,
    status: "Active",
  };

  lead.field_data.forEach((f) => {
    obj[f.name] = f.values?.[0] || "";
  });

  return obj;
};

export default function FranchiseLeadsPage() {
  const [formId] = useState(FORMS[0].id);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------------- FETCH LEADS ---------------- */
  const fetchLeads = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/meta/leads?formId=${formId}&limit=300&summary=true`
      );
      const data = await res.json();

      if (data.success) {
        setLeads(data.leads.map(normalizeLead));
        setTotalLeads(data.summary?.total_count || data.leads.length);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    }

    setLoading(false);
  };

  /* ---------------- LOAD ---------------- */
  useEffect(() => {
    fetchLeads();
  }, []);

  /* ---------------- SEARCH FILTER ---------------- */
  const filteredLeads = useMemo(() => {
    if (!search) return leads;

    return leads.filter((lead) => {
      const text = `
        ${lead.full_name}
        ${lead.phone_number}
        ${lead.email}
        ${lead.city}
        ${lead["what_is_your_current_occupation?"]}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [leads, search]);

  /* ---------------- PAGINATION ---------------- */
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredLeads.slice(start, end);
  }, [filteredLeads, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ---------------- STATS ---------------- */
  const stats = useMemo(() => {
    const today = leads.filter((l) => {
      if (!l.created_time) return false;
      return (
        new Date(l.created_time).toDateString() ===
        new Date().toDateString()
      );
    }).length;

    return [
      { label: "Total Leads", value: totalLeads, icon: Users },
      { label: "New Today", value: today, icon: TrendingUp },
      { label: "Active", value: leads.length, icon: Activity },
      { label: "Follow Up", value: 0, icon: Clock },
      { label: "Onboard", value: 0, icon: UserCheck },
      { label: "Inactive", value: 0, icon: UserX },
    ];
  }, [leads, totalLeads]);

  /* ---------------- STATUS CHANGE ---------------- */
  const handleStatusChange = (id, newStatus) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, status: newStatus } : lead
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-6 h-6" /> Franchise Leads
          </h1>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search name, phone, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg w-72"
            />

            <button
              onClick={fetchLeads}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="p-4 bg-white border rounded-xl">
              <s.icon className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">City</th>
                  <th className="px-6 py-3 text-left">Occupation</th>
                  <th className="px-6 py-3 text-left">Investment</th>
                  <th className="px-6 py-3 text-left">Contact</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-gray-500">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-3 font-medium">{lead.full_name || "Unknown"}</td>
                      <td className="px-6 py-3">{lead.city || "-"}</td>
                      <td className="px-6 py-3">
                        {lead["what_is_your_current_occupation?"] || "-"}
                      </td>
                      <td className="px-6 py-3">
                        {lead.mention_investment_rang || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone_number}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {new Date(lead.created_time).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value)
                          }
                          className="px-3 py-1 rounded-full text-xs border"
                        >
                          {STATUS_STEPS.map((s) => (
                            <option key={s.label}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 flex justify-between items-center bg-gray-50 border-t">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(currentPage * PAGE_SIZE, filteredLeads.length)} of{" "}
              {filteredLeads.length}
            </p>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={currentPage * PAGE_SIZE >= filteredLeads.length}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
