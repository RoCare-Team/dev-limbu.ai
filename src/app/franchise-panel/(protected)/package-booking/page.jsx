"use client";

import { useEffect, useState } from "react";
import { BOOKING_SOURCE_VALUES, bookingSourceLabel } from "@/lib/bookingSource";

export default function FranchisePackageBookingList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log("franchise panel package data:", data);

  const patchBookingSource = async (bookingId, bookingSource) => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("franchise_token") ||
            localStorage.getItem("token")
          : null;
      const res = await fetch("/api/service-booking", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ bookingId, bookingSource }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Update failed");
      setData((prev) =>
        prev.map((row) =>
          row._id === bookingId
            ? { ...row, bookingSource: json.data.bookingSource }
            : row,
        ),
      );
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not update source");
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/service-booking?planType=our-package");
        const json = await res.json();
        if (!json.success) throw new Error("Failed to fetch bookings");
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 font-semibold py-10">
        {error}
      </div>
    );

  const formatAmount = (val) => {
    const clean = String(val).replace(/[₹,\s]/g, "");
    const num = Number(clean);
    if (!clean || isNaN(num)) return "—";
    return "₹" + num.toLocaleString("en-IN");
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Service Bookings</h2>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
        {/* Table Header Bar */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            {/* Black sticky thead */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1e293b] text-white text-xs uppercase tracking-wider">
                <th className="px-6 py-4 text-left font-semibold">Customer</th>
                <th className="px-6 py-4 text-left font-semibold">Contact</th>
                <th className="px-6 py-4 text-left font-semibold">Plan</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-left font-semibold">GST No.</th>
                <th className="px-6 py-4 text-center font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Date</th>
              </tr>
            </thead>

            {/* White tbody */}
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  {/* Customer */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-600 text-white font-semibold text-sm shadow-sm flex-shrink-0">
                        {item.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-5 text-gray-600 font-medium">
                    {item.phone}
                  </td>

                  {/* Plan */}
                  <td className="px-6 py-5">
                    <span className="bg-blue-50 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border border-blue-100">
                      {item.planTitle}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-5 text-right">
                    <span className="font-bold text-gray-900 text-base">
                      {formatAmount(item.totalAmount)}
                    </span>
                  </td>

                  {/* GST */}
                  <td className="px-6 py-5 text-gray-500 text-sm">
                    {item.gstNumber || "-"}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        item.status === "paid"
                          ? "bg-green-500 text-white"
                          : "bg-yellow-400 text-white"
                      }`}
                    >
                      {item.status?.toLowerCase()}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-5 text-right text-gray-500 text-sm whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="grid gap-4 md:hidden">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                  item.status === "paid" ? "bg-green-500" : "bg-yellow-400"
                }`}
              >
                {item.status?.toLowerCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600">📞 {item.phone}</p>
            <p className="text-sm text-gray-600">📧 {item.email}</p>
            <p className="text-sm font-semibold text-gray-800">
              {item.planTitle}
            </p>

            <label className="text-xs text-gray-500 block">Source</label>
            <select
              value={item.bookingSource || "website"}
              onChange={(e) => patchBookingSource(item._id, e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              {BOOKING_SOURCE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {bookingSourceLabel(v)}
                </option>
              ))}
            </select>

            <div className="flex justify-between text-sm pt-1">
              <span className="font-bold text-gray-900">
                {formatAmount(item.totalAmount)}
              </span>
              <span className="text-gray-400">
                {new Date(item.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
