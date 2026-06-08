"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import SelectedLeadsActionBar5 from "./component-modal/SelectedLeadsActionBar5";

export default function DemoPage() {
  const [bookings, setBookings] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    calendarDate: "",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [search, setSearch] = useState("");

  const displayedBookings = useMemo(() => {
    const base = activeTab === "today" ? todayBookings : bookings;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((item) =>
      [
        item.name,
        item.phone,
        item.seminarTime,
        item.selectedDate,
        item.selectedDateLabel,
        item.assignedAgentName,
        item.status,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [activeTab, bookings, todayBookings, search]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookDemo?admin=1", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) return;
      console.log("datadata",data);
      

      setBookings(Array.isArray(data.data) ? data.data : []);
      setTodayBookings(Array.isArray(data.todayData) ? data.todayData : []);
      setStats({
        total: data.count || 0,
        today: data.todayCount || 0,
        calendarDate: data.calendarDate || "",
      });
      setSelectedRows([]);
    } catch (error) {
      console.error("Failed to load demo bookings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(displayedBookings.map((item) => item._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const updateStatus = async (id, status) => {
    await fetch("/api/bookDemo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadBookings();
  };

  const deleteBooking = async (id) => {
    await fetch("/api/bookDemo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadBookings();
  };

  const syncUsers = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;
    await fetch(
      `/api/admin/demo-bookings-sync?email=${encodeURIComponent(email)}`,
      { method: "POST" },
    );
    loadBookings();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demo Booked</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete demo booking data from demoBookingDB
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadBookings}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={syncUsers}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Users size={16} />
            Register Users
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-xl border p-4 text-left transition ${
            activeTab === "all"
              ? "border-rose-500 bg-rose-600 text-white shadow-md"
              : "border-gray-200 bg-white text-gray-900 hover:border-rose-200"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">
            Total Demo Booked
          </p>
          <p className="text-3xl font-black mt-1">{stats.total}</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`rounded-xl border p-4 text-left transition ${
            activeTab === "today"
              ? "border-rose-500 bg-rose-50 text-rose-900 shadow-md ring-2 ring-rose-300"
              : "border-gray-200 bg-white text-gray-900 hover:border-rose-200"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-rose-600">
            Today Demo Booked
          </p>
          <p className="text-3xl font-black mt-1 text-rose-700">{stats.today}</p>
          {stats.calendarDate && (
            <p className="text-[11px] mt-1 text-rose-500">
              Scheduled for {stats.calendarDate}
            </p>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, date, time..."
          className="w-full md:max-w-md rounded-lg border border-gray-200 px-4 py-2 text-sm"
        />
        <p className="text-sm text-gray-500">
          Showing {displayedBookings.length}{" "}
          {activeTab === "today" ? "today" : "total"} demo bookings
        </p>
      </div>

      <SelectedLeadsActionBar5 selectedRows={selectedRows} leads={displayedBookings} />

      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 shadow-sm">
            <tr>
              <th className="px-4 py-2.5 text-center bg-gray-50">
                <input
                  type="checkbox"
                  checked={
                    displayedBookings.length > 0 &&
                    selectedRows.length === displayedBookings.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600">Name</th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600">Phone</th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600">Demo Time</th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600">Demo Date</th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600">Assigned Agent</th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600">Booked On</th>
              <th className="px-5 py-4 text-center font-semibold text-gray-600">User</th>
              <th className="px-5 py-4 text-center font-semibold text-gray-600">Status</th>
              <th className="px-5 py-4 text-center font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-gray-500">
                  Loading demo bookings...
                </td>
              </tr>
            ) : displayedBookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-gray-500">
                  No demo bookings found
                  {activeTab === "today" && stats.calendarDate
                    ? ` for ${stats.calendarDate}`
                    : ""}
                  .
                </td>
              </tr>
            ) : (
              displayedBookings.map((b, i) => (
                <tr
                  key={b._id}
                  className={`hover:bg-gray-50 transition ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(b._id)}
                      onChange={() => handleSelectRow(b._id)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{b.name}</td>
                  <td className="px-5 py-4 text-gray-700">{b.phone}</td>
                  <td className="px-5 py-4 text-rose-600 font-medium">{b.seminarTime}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {b.selectedDateLabel || b.selectedDate || "—"}
                    </span>
                    {b.selectedDate && (
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                        {b.selectedDate}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        b.assignedAgentName && b.assignedAgentName !== "Unassigned"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {b.assignedAgentName || "Unassigned"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleString("en-IN")
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.userCreated
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {b.userCreated ? "Registered" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        b.status === "Attended"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      {b.status === "Not Attended" && (
                        <>
                          <button
                            onClick={() => updateStatus(b._id, "Attended")}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition"
                          >
                            Mark Attended
                          </button>
                          <button
                            onClick={() => updateStatus(b._id, "Not Attended")}
                            className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white text-xs font-medium hover:bg-yellow-600 transition"
                          >
                            Not Attended
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteBooking(b._id)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
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
