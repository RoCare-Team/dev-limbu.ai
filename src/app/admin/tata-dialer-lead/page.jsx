"use client";

import { useEffect, useState } from "react";
import { Calendar, Send, Mail, MessageSquare, Smartphone, Filter, X, Download, RefreshCw, Search } from "lucide-react";

export default function TataDailerLeadPage() {
  /* ================= STATES ================= */
  const [calls, setCalls] = useState([]);
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  /* Filters */
  const [search, setSearch] = useState("");
  const [mobile, setMobile] = useState("");
  const [digit, setDigit] = useState("");
  const [campaign, setCampaign] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit] = useState(60);
  const [total, setTotal] = useState(0);

  /* Messaging */
  const [sendDate, setSendDate] = useState("");
  const [messageType, setMessageType] = useState("whatsapp"); // whatsapp, rcs, email, sms
  const [showMessagePanel, setShowMessagePanel] = useState(false);

  /* ================= FETCH DATA ================= */
  const fetchData = async (pageNumber = page) => {
    setLoading(true);
    setResult(null);

    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (mobile) params.append("mobile_no", mobile);
    if (digit) params.append("digit_pressed", digit);
    if (campaign) params.append("campaign_name", campaign);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    // pagination
    params.append("page", pageNumber);
    params.append("limit", limit);

    const res = await fetch(`/api/incoming-ivr?${params.toString()}`);
    const json = await res.json();

    if (json.success) {
      setCalls(json.data);
      setTotal(json.total);
      setPage(json.page);
      setSelected([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  /* ================= CLEAR FILTERS ================= */
  const clearFilters = () => {
    setSearch("");
    setMobile("");
    setDigit("");
    setCampaign("");
    setStartDate("");
    setEndDate("");
  };

  /* ================= SELECTION ================= */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(selected.length === calls.length ? [] : calls.map((c) => c._id));
  };

  /* ================= DATE → CAMPAIGN ================= */


const getCampaignByDate = (dateStr) => {
  const day = new Date(dateStr).getDay(); // 0=Sun, 5=Fri

  if (day === 0) return null;              // Sunday blocked
  if (day === 5) return "demo_session_confirmation1"; // Friday → 5:30 PM
  return "demo_session_confirmation1";                 // Mon–Sat → 4 PM
};

const sendMessage = async () => {
  try {
    if (!sendDate) {
      setResult({
        success: false,
        message: "Please select a date for scheduling",
      });
      return;
    }

    const campaignName = getCampaignByDate(sendDate);

    if (!campaignName && messageType === "whatsapp") {
      setResult({
        success: false,
        message: "WhatsApp sending is disabled on Sunday",
      });
      return;
    }

    /* ================= ONLY DID NUMBER ================= */
    const users = calls
      .filter((c) => selected.includes(c._id))
      .map((c) => ({
        customer_no_with_prefix: c.did_number, // ✅ ONLY THIS NUMBER WILL BE SENT
        name: c.name || "User",
      }))
      .filter((u) => u.customer_no_with_prefix); // remove empty did numbers

    if (!users.length) {
      setResult({
        success: false,
        message: "No valid DID numbers selected",
      });
      return;
    }

    setSending(true);
    setResult(null);

    let endpoint = "";

    switch (messageType) {
      case "whatsapp":
        endpoint = "/api/tata-dailer-whatsapp";
        break;
      case "rcs":
        endpoint = "/api/tata-dailer-rcs";
        break;
      case "email":
        endpoint = "/api/tata-dailer-email";
        break;
      case "sms":
        endpoint = "/api/tata-dailer-sms";
        break;
      default:
        endpoint = "/api/tata-dailer-whatsapp";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        users,
        campaignName,
        scheduleDate: sendDate,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      setResult({
        success: false,
        message: json?.message || "Server error occurred",
      });
    } else {
      setResult({
        success: json.success,
        message: json.message || "Message processed",
        sent: json.sent || 0,
      });
    }
  } catch (error) {
    console.error("Send Message Error:", error);

    setResult({
      success: false,
      message: "Something went wrong while sending",
    });
  } finally {
    setSending(false);
  }
};


  /* ================= EXPORT DATA ================= */
  const exportData = () => {
    const selectedData = calls.filter((c) => selected.includes(c._id));
    const csv = [
      ["Customer No", "Mobile", "Digit", "Direction", "Call Time", "Campaign"],
      ...selectedData.map((c) => [
        c.customer_no_with_prefix,
        c.mobile_no,
        c.digit_pressed || "-",
        c.direction,
        c.action_date_time,
        c.campaign_name || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(total / limit);

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                📞 Tata Dialer Lead Management
              </h1>
              <p className="text-gray-600 mt-1">Manage and track incoming IVR leads</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchData(page)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
              >
                <Filter size={18} />
                {showFilters ? "Hide" : "Show"} Filters
              </button>
            </div>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter size={20} className="text-indigo-600" />
                Advanced Filters
              </h2>
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X size={16} />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Search size={16} />
                  Search (Customer No / Mobile / Campaign)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="e.g.,mobile number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setPage(1);
                        fetchData(1);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setPage(1);
                      fetchData(1);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-md flex items-center gap-2"
                  >
                    <Search size={18} />
                    Search
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digit Pressed
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={digit}
                  onChange={(e) => setDigit(e.target.value)}
                >
                  <option value="">All Digits</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Enter campaign name"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPage(1);
                    fetchData(1);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg px-6 py-2.5 font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== STATS BAR ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-600">Total Leads</p>
            <p className="text-2xl font-bold text-indigo-600">{total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600">Current Page</p>
            <p className="text-2xl font-bold text-purple-600">{page}/{totalPages}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-2xl font-bold text-green-600">{selected.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600">Per Page</p>
            <p className="text-2xl font-bold text-orange-600">{limit}</p>
          </div>
        </div>

        {/* ===== ACTION BAR ===== */}
        {selected.length > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-3">
                  <Smartphone className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm opacity-90">Selected Leads</p>
                  <p className="text-2xl font-bold">{selected.length}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setMessageType("whatsapp");
                    setShowMessagePanel(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-white text-green-600 px-4 py-3 rounded-lg font-medium hover:bg-green-50 transition shadow-md"
                >
                  <MessageSquare size={20} />
                  WhatsApp
                </button>

                <button
                  onClick={() => {
                    setMessageType("rcs");
                    setShowMessagePanel(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-white text-blue-600 px-4 py-3 rounded-lg font-medium hover:bg-blue-50 transition shadow-md"
                >
                  <Send size={20} />
                  RCS
                </button>

                <button
                  onClick={() => {
                    setMessageType("email");
                    setShowMessagePanel(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-white text-purple-600 px-4 py-3 rounded-lg font-medium hover:bg-purple-50 transition shadow-md"
                >
                  <Mail size={20} />
                  Email
                </button>

                <button
                  onClick={() => {
                    setMessageType("sms");
                    setShowMessagePanel(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-white text-orange-600 px-4 py-3 rounded-lg font-medium hover:bg-orange-50 transition shadow-md"
                >
                  <Smartphone size={20} />
                  SMS
                </button>
              </div>

           
            </div>
          </div>
        )}

        {/* ===== MESSAGE PANEL ===== */}
        {showMessagePanel && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {messageType === "whatsapp" && <MessageSquare className="text-green-600" />}
                {messageType === "rcs" && <Send className="text-blue-600" />}
                {messageType === "email" && <Mail className="text-purple-600" />}
                {messageType === "sms" && <Smartphone className="text-orange-600" />}
                Send {messageType.toUpperCase()} to {selected.length} leads
              </h3>
              <button
                onClick={() => setShowMessagePanel(false)}
                className="text-gray-500 hover:text-gray-700"
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
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send {messageType.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== RESULT MESSAGE ===== */}
        {result && (
          <div
            className={`mb-6 p-5 rounded-2xl shadow-lg border-l-4 ${
              result.success
                ? "bg-green-50 text-green-800 border-green-500"
                : "bg-red-50 text-red-800 border-red-500"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-bold text-lg mb-1">
                  {result.success ? "✓ Success" : "✗ Error"}
                </p>
                <p>{result.message}</p>
                {result.sent !== undefined && (
                  <p className="mt-2 font-semibold">Messages sent: {result.sent}</p>
                )}
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      onChange={selectAll}
                      checked={calls.length > 0 && selected.length === calls.length}
                      className="w-5 h-5 rounded border-white/30 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 text-left font-semibold">Customer No</th>
                  <th className="p-4 text-left font-semibold">Mobile</th>
                  <th className="p-4 text-left font-semibold">Digit</th>
                  <th className="p-4 text-left font-semibold">Direction</th>
                  <th className="p-4 text-left font-semibold">Call Time</th>
                  <th className="p-4 text-left font-semibold">Campaign</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="animate-spin text-indigo-600" size={32} />
                        <p className="text-gray-600">Loading leads...</p>
                      </div>
                    </td>
                  </tr>
                ) : calls.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <MessageSquare className="text-gray-300" size={48} />
                        <p className="text-gray-600 font-medium">No leads found</p>
                        <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  calls.map((c, idx) => (
                    <tr
                      key={c._id}
                      className={`hover:bg-indigo-50 transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(c._id)}
                          onChange={() => toggleSelect(c._id)}
                          className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {c.did_number}
                      </td>
                      <td className="p-4 text-gray-700">{c.mobile_no}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            c.digit_pressed === "1"
                              ? "bg-blue-100 text-blue-700"
                              : c.digit_pressed === "2"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {c.digit_pressed || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                          {c.direction}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{c.action_date_time}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {c.campaign_name || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ===== PAGINATION ===== */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing page <span className="font-semibold text-indigo-600">{page}</span> of{" "}
                  <span className="font-semibold text-indigo-600">{totalPages}</span> | Total{" "}
                  <span className="font-semibold text-indigo-600">{total}</span> leads
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => fetchData(1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    First
                  </button>
                  <button
                    disabled={page === 1}
                    onClick={() => fetchData(page - 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => fetchData(page + 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Next
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => fetchData(totalPages)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}