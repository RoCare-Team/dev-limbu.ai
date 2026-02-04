"use client";

import { useEffect, useState } from "react";

export default function TataDailerLeadPage() {
  /* ================= STATES ================= */
  const [calls, setCalls] = useState([]);
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  /* Filters */
  const [mobile, setMobile] = useState("");
  const [digit, setDigit] = useState("");
  const [campaign, setCampaign] = useState("");
  const [filterDate, setFilterDate] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit] = useState(60);
  const [total, setTotal] = useState(0);

  /* WhatsApp */
  const [sendDate, setSendDate] = useState("");

  /* ================= FETCH DATA ================= */
  const fetchData = async (pageNumber = page) => {
    setLoading(true);
    setResult(null);

    const params = new URLSearchParams();

    if (mobile) params.append("mobile_no", mobile);
    if (digit) params.append("digit_pressed", digit);
    if (campaign) params.append("campaign_name", campaign);
    if (filterDate) params.append("date", filterDate);

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

  /* ================= SELECTION ================= */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(
      selected.length === calls.length
        ? []
        : calls.map((c) => c._id)
    );
  };

  /* ================= DATE → CAMPAIGN ================= */
  const getCampaignByDate = (dateStr) => {
    const day = new Date(dateStr).getDay(); // 0=Sun, 5=Fri
    if (day === 5) return "session530pm";
    if (day >= 1 && day <= 6) return "session4pm";
    return null; // Sunday blocked
  };

  /* ================= SEND WHATSAPP ================= */
  const sendWhatsApp = async () => {
    if (!sendDate) return;

    const campaignName = getCampaignByDate(sendDate);
    if (!campaignName) {
      setResult({
        success: false,
        message: "WhatsApp sending is disabled on Sunday",
      });
      return;
    }

    const users = calls
      .filter((c) => selected.includes(c._id))
      .map((c) => ({
        customer_no_with_prefix: c.customer_no_with_prefix,
      }));

    if (!users.length) return;

    setSending(true);
    setResult(null);

    const res = await fetch("/api/tata-dailer-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users, campaignName }),
    });

    const json = await res.json();
    setSending(false);

    setResult({
      success: json.success,
      message: json.message,
      sent: json.sent,
    });
  };

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(total / limit);

  /* ================= UI ================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">
        📞 Tata Dailer – Incoming IVR Leads
      </h1>

      {/* ===== FILTERS ===== */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          className="border rounded px-3 py-2"
          placeholder="Mobile No"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <select
          className="border rounded px-3 py-2"
          value={digit}
          onChange={(e) => setDigit(e.target.value)}
        >
          <option value="">Digit</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>

        <input
          className="border rounded px-3 py-2"
          placeholder="Campaign Name"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
        />

        <input
          type="date"
          className="border rounded px-3 py-2"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <button
          onClick={() => {
            setPage(1);
            fetchData(1);
          }}
          className="bg-blue-600 text-white rounded px-4 py-2"
        >
          Apply Filters
        </button>
      </div>

      {/* ===== WHATSAPP BAR ===== */}
      {selected.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-wrap gap-4 items-center">
          <span className="font-semibold text-gray-700">
            {selected.length} selected
          </span>

          <input
            type="date"
            className="border rounded px-3 py-2"
            value={sendDate}
            onChange={(e) => setSendDate(e.target.value)}
          />

          <button
            onClick={sendWhatsApp}
            disabled={sending}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send WhatsApp"}
          </button>
        </div>
      )}

      {/* ===== RESULT MESSAGE ===== */}
      {result && (
        <div
          className={`mb-4 p-4 rounded-xl text-sm ${
            result.success
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          <b>{result.success ? "Success" : "Error"}:</b>{" "}
          {result.message}
          {result.sent !== undefined && (
            <div>Messages sent: {result.sent}</div>
          )}
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">
                <input
                  type="checkbox"
                  onChange={selectAll}
                  checked={
                    calls.length > 0 &&
                    selected.length === calls.length
                  }
                />
              </th>
              <th className="p-3 border">Customer No</th>
              <th className="p-3 border">Mobile</th>
              <th className="p-3 border">Digit</th>
              <th className="p-3 border">Direction</th>
              <th className="p-3 border">Call Time</th>
              <th className="p-3 border">Campaign</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center">
                  No data found
                </td>
              </tr>
            ) : (
              calls.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="p-3 border text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(c._id)}
                      onChange={() => toggleSelect(c._id)}
                    />
                  </td>
                  <td className="p-3 border">
                    {c.customer_no_with_prefix}
                  </td>
                  <td className="p-3 border">{c.mobile_no}</td>
                  <td className="p-3 border font-semibold">
                    {c.digit_pressed || "-"}
                  </td>
                  <td className="p-3 border">{c.direction}</td>
                  <td className="p-3 border">
                    {c.action_date_time}
                  </td>
                  <td className="p-3 border">
                    {c.campaign_name || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages} | Total {total}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => fetchData(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => fetchData(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
