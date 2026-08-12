"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

/* ---------------- FORM IDS ---------------- */
const FORMS = [
  {
    id: "1344734835382149",
    label: "Service Leads",
  },
  {
    id: "1092789519760679",
    label: "Real Estate Leads",
  },
  {
    id: "37110369011883462",
    label: "Real Estate Leads (Survey)",
  },
  {
    id: "1213106820766164",
    label: "Franchise Leads",
  },
];

/* ---------------- NORMALIZE LEAD ---------------- */
const normalizeLead = (lead) => {
  const obj = {
    id: lead.id,
    created_time: lead.created_time,
  };

  lead.field_data.forEach((f) => {
    obj[f.name] = f.values?.[0] || "";
  });

  return obj;
};

export default function MetaLeadsPage() {
  const [formId, setFormId] = useState(FORMS[0].id);

  const [leads, setLeads] = useState([]);
  const [paging, setPaging] = useState({});
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);

  /* ---------------- FETCH LEADS ---------------- */
  const fetchLeads = async ({ cursor, type } = {}) => {
    setLoading(true);

    let url = `/api/meta/leads?formId=${formId}`;

    if (cursor && type) {
      url += `&${type}=${cursor}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setLeads(data.leads.map(normalizeLead));
        setPaging(data.paging || {});
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    }

    setLoading(false);
  };

  /* ---------------- INITIAL LOAD + FORM CHANGE ---------------- */
  useEffect(() => {
    setPage(1);
    setPaging({});
    fetchLeads();
  }, [formId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ---------------- HEADER ---------------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              Facebook Lead Ads
            </h1>
            <p className="text-gray-500 mt-1 ml-1">
              Manage and view your incoming leads from Meta.
            </p>
          </div>

          {/* FORM SWITCH + REFRESH */}
          <div className="flex gap-2 items-center">
            <select
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FORMS.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchLeads()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm font-medium"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ---------------- STATS ---------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Page</p>
              <p className="text-2xl font-bold">{page}</p>
            </div>
            <Users className="w-6 h-6 text-blue-600" />
          </div>

          <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Leads on Page</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </div>
            <Briefcase className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* ---------------- TABLE ---------------- */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-xs text-gray-500">Name</th>
                  <th className="p-4 text-xs text-gray-500">City</th>
                  <th className="p-4 text-xs text-gray-500">Business</th>
                  <th className="p-4 text-xs text-gray-500">Contact</th>
                  <th className="p-4 text-xs text-gray-500">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-gray-500">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">
                        {lead.full_name || "-"}
                      </td>
                      <td className="p-4">
                        {lead.city || "-"}
                      </td>
                      <td className="p-4">
                        {lead["what_type_of_real_estate_business_do_you_run?"] ||
                          lead["what_type_of_business_do_you_run?"] ||
                          "-"}
                      </td>
                      <td className="p-4 text-sm">
                        {lead.phone_number && (
                          <div className="flex gap-1 items-center">
                            <Phone className="w-3 h-3" />
                            {lead.phone_number}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex gap-1 items-center">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(lead.created_time).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ---------------- PAGINATION ---------------- */}
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <button
              disabled={!paging?.cursors?.before || loading}
              onClick={() => {
                fetchLeads({
                  cursor: paging.cursors.before,
                  type: "before",
                });
                setPage((p) => Math.max(1, p - 1));
              }}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm font-medium text-gray-500">
              Page {page}
            </span>

            <button
              disabled={!paging?.cursors?.after || loading}
              onClick={() => {
                fetchLeads({
                  cursor: paging.cursors.after,
                  type: "after",
                });
                setPage((p) => p + 1);
              }}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
