"use client";

import { useEffect, useState } from "react";
import { BOOKING_SOURCE_VALUES, bookingSourceLabel } from "@/lib/bookingSource";

import SelectedLeadsActionBar from "./component-modal/SelectedLeadsActionBar";

import Lottie from "lottie-react";
import animationData from "../../../../src/assets/animation/Loading.json";

export default function ServiceBookingList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Selected rows state
const [selectedRows, setSelectedRows] = useState([]);

// Select all rows
const handleSelectAll = (checked) => {
  if (checked) {
    setSelectedRows(filteredData.map((item) => item._id));
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
        const res = await fetch("/api/service-booking?planType=our-service");
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

  const filteredData = data.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.name || "").toLowerCase().includes(q) ||
      String(item.email || "").toLowerCase().includes(q) ||
      String(item.phone || "").toLowerCase().includes(q) ||
      String(item.planTitle || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 mt-2">
        <h2 className="text-3xl font-bold text-slate-900">Service Bookings</h2>
        <p className="mt-1 text-sm text-slate-500">Track all service plan bookings in one place</p>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, email, contact, plan..."
          className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Desktop Table */}
     {/* Desktop Table */}
<div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">

    <>

          <SelectedLeadsActionBar selectedRows={selectedRows} />

       <table className="min-w-full text-sm text-gray-700">
      

  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">

    <tr>
      
    
      {/* Select All Checkbox */}
      <th className="px-5 py-4 text-center">
        <input
          type="checkbox"
          checked={
            filteredData.length > 0 &&
            selectedRows.length === filteredData.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 accent-blue-600 cursor-pointer"
        />
      </th>

      <th className="px-5 py-4 text-left font-semibold">Customer</th>
      <th className="px-5 py-4 text-left">Contact</th>
      <th className="px-5 py-4 text-left">Plan</th>
      <th className="px-5 py-4 text-left">Source</th>
      <th className="px-5 py-4 text-right">Amount</th>
      <th className="px-5 py-4 text-left">GST No.</th>
      <th className="px-5 py-4 text-center">Status</th>
      <th className="px-5 py-4 text-right">Date</th>
    </tr>
  </thead>

  <tbody>
    {filteredData.map((item, index) => (
      <tr
        key={item._id}
        className={`border-b transition ${
          index % 2 === 0 ? "bg-gray-50" : "bg-white"
        } hover:bg-blue-50`}
      >
        {/* Row Checkbox */}
        <td className="px-5 py-4 text-center">
          <input
            type="checkbox"
            checked={selectedRows.includes(item._id)}
            onChange={() => handleSelectRow(item._id)}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </td>

        {/* Name */}
        <td className="px-5 py-4">
          <div className="font-semibold text-gray-900">
            {item.name}
          </div>
          <div className="text-xs text-gray-500">
            {item.email}
          </div>
        </td>

        {/* Contact */}
        <td className="px-5 py-4">
          <div className="text-gray-800">{item.phone}</div>
        </td>

        {/* Plan */}
        <td className="px-5 py-4 font-medium text-indigo-600">
          {item.planTitle}
        </td>

        {/* Source */}
        <td
          className="px-5 py-4"
          onClick={(e) => e.stopPropagation()}
        >
          <select
            value={item.bookingSource || "website"}
            onChange={(e) =>
              patchBookingSource(item._id, e.target.value)
            }
            className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-200"
          >
            {BOOKING_SOURCE_VALUES.map((v) => (
              <option key={v} value={v}>
                {bookingSourceLabel(v)}
              </option>
            ))}
          </select>
        </td>

        {/* Amount */}
        <td className="px-5 py-4 text-right font-bold text-gray-900">
          {item.totalAmount}
        </td>

        {/* GST */}
        <td className="px-5 py-4 text-gray-700">
          {item.gstNumber || "—"}
        </td>

        {/* Status */}
        <td className="px-5 py-4 text-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              item.status === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {item.status.toUpperCase()}
          </span>
        </td>

        {/* Date */}
        <td className="px-5 py-4 text-right text-gray-600">
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
</div>


      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {filteredData.map((item) => (
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
