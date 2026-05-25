"use client";

import { useEffect, useState } from "react";
import { BOOKING_SOURCE_VALUES, bookingSourceLabel } from "@/lib/bookingSource";

import Lottie from "lottie-react";
import animationData from "../../../../src/assets/animation/Loading.json";

import SelectedLeadsActionBar2 from "./component-modal/SelectedLeadsActionBar2"

export default function PackageBookingList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // Selected rows state
const [selectedRows, setSelectedRows] = useState([]);

// Select all rows
const handleSelectAll = (checked) => {
  if (checked) {
    setSelectedRows(data.map((item) => item._id));
  } else {
    setSelectedRows([]);
  }
};

// Select single row
const handleSelectRow = (id) => {
  setSelectedRows((prev) =>
    prev.includes(id)
      ? prev.filter((rowId) => rowId !== id)
      : [...prev, id]
  );
};

  const patchBookingSource = async (bookingId, bookingSource) => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") ||
            localStorage.getItem("franchise_token")
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

   if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-40 h-40 mx-auto flex items-center justify-center">
            <Lottie
              animationData={animationData}
              loop={true}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="text-center text-red-600 font-semibold py-10">
        {error}
      </div>
    );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Package Bookings</h2>

      {/* Desktop Table */}
     {/* Desktop Table */}
    <div className="hidden md:block bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">

  {/* Header */}
  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
    <h2 className="text-lg font-bold text-gray-800">Customer Transactions</h2>
    <span className="text-sm text-gray-500">{data.length} Records</span>
  </div>

  <div className="overflow-x-auto">
    
  </div>
  <>
  {/* Bulk Action Bar */}
  <SelectedLeadsActionBar2 selectedRows={selectedRows} />

  <table className="min-w-full text-sm text-gray-700">
    {/* THEAD */}
    <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">
      <tr className="text-xs uppercase tracking-wider">
        {/* Select All Checkbox */}
        <th className="px-6 py-4 text-center">
          <input
            type="checkbox"
            checked={
              data.length > 0 &&
              selectedRows.length === data.length
            }
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </th>

        <th className="px-6 py-4 text-left font-semibold">Customer</th>
        <th className="px-6 py-4 text-left">Contact</th>
        <th className="px-6 py-4 text-left">Plan</th>
        <th className="px-6 py-4 text-left">Source</th>
        <th className="px-6 py-4 text-right">Amount</th>
        <th className="px-6 py-4 text-left">GST No.</th>
        <th className="px-6 py-4 text-center">Status</th>
        <th className="px-6 py-4 text-right">Date</th>
      </tr>
    </thead>

    {/* TBODY */}
    <tbody className="divide-y divide-gray-100">
      {data.map((item) => (
        <tr
          key={item._id}
          className="group hover:bg-blue-50 transition duration-200"
        >
          {/* Row Checkbox */}
          <td className="px-6 py-5 text-center">
            <input
              type="checkbox"
              checked={selectedRows.includes(item._id)}
              onChange={() => handleSelectRow(item._id)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </td>

          {/* Customer */}
          <td className="px-6 py-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-11 h-11 flex items-center justify-center rounded-full 
                bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold text-sm
                shadow-md ring-2 ring-blue-100"
              >
                {item.name?.charAt(0)}
              </div>

              {/* Info */}
              <div>
                <div className="font-semibold text-gray-900">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500">
                  {item.email}
                </div>
              </div>
            </div>
          </td>

          {/* Contact */}
          <td className="px-6 py-5 text-gray-700 font-medium">
            {item.phone}
          </td>

          {/* Plan */}
          <td className="px-6 py-5">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
              {item.planTitle}
            </span>
          </td>

          {/* Source */}
          <td
            className="px-6 py-5"
            onClick={(e) => e.stopPropagation()}
          >
            <select
              value={item.bookingSource || "website"}
              onChange={(e) =>
                patchBookingSource(item._id, e.target.value)
              }
              className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-200"
              title="Where this booking came from"
            >
              {BOOKING_SOURCE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {bookingSourceLabel(v)}
                </option>
              ))}
            </select>
          </td>

          {/* Amount */}
          <td className="px-6 py-5 text-right">
            <span className="font-bold text-gray-900 text-base">
              {item.totalAmount}
            </span>
          </td>

          {/* GST */}
          <td className="px-6 py-5 text-gray-600">
            {item.gstNumber || "—"}
          </td>

          {/* Status */}
          <td className="px-6 py-5 text-center">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                item.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  item.status === "paid"
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              ></span>
              {item.status.toUpperCase()}
            </span>
          </td>

          {/* Date */}
          <td className="px-6 py-5 text-right text-gray-500 text-sm whitespace-nowrap">
            {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</>
</div>


      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-xl shadow p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{item.name}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  item.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {item.status}
              </span>
            </div>

            <p className="text-sm text-gray-600">📞 {item.phone}</p>
            <p className="text-sm text-gray-600">📧 {item.email}</p>
            <p className="text-sm font-semibold">{item.planTitle}</p>
            <label className="text-xs text-gray-500 block">Source</label>
            <select
              value={item.bookingSource || "website"}
              onChange={(e) => patchBookingSource(item._id, e.target.value)}
              className="w-full text-sm border rounded-lg px-2 py-1"
            >
              {BOOKING_SOURCE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {bookingSourceLabel(v)}
                </option>
              ))}
            </select>
            <div className="flex justify-between text-sm">
              <span>{item.totalAmount}</span>
              <span className="text-gray-500">
                {new Date(item.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
