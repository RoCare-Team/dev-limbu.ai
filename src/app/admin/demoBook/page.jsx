"use client";

import { useEffect, useState } from "react";

import SelectedLeadsActionBar5 from "./component-modal/SelectedLeadsActionBar5"

export default function DemoPage() {
  const [bookings, setBookings] = useState([]);

  // Selected rows state
const [selectedRows, setSelectedRows] = useState([]);

// Select all rows
const handleSelectAll = (checked) => {
  if (checked) {
    setSelectedRows(bookings.map((item) => item._id));
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

  // ---------------------------
  // FETCH ALL BOOKINGS
  // ---------------------------
  const loadBookings = async () => {
    const res = await fetch("/api/bookDemo");
    const data = await res.json();
    setBookings(data.data);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // ---------------------------
  // UPDATE STATUS
  // ---------------------------
  const updateStatus = async (id, status) => {
    await fetch("/api/bookDemo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    loadBookings();
  };

  // ---------------------------
  // DELETE BOOKING
  // ---------------------------
  const deleteBooking = async (id) => {
    await fetch("/api/bookDemo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    loadBookings();
  };

  // ---------------------------
  // TABLE UI
  // ---------------------------
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Demo Bookings</h1>


      <SelectedLeadsActionBar5 selectedRows={selectedRows} />

     <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
  <table className="min-w-full text-sm text-gray-700">
    {/* Table Header */}
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>

           <th className="px-4 py-2.5 text-center">
          <input
  type="checkbox"
  checked={
    bookings.length > 0 &&
    selectedRows.length === bookings.length
  }
  onChange={(e) => handleSelectAll(e.target.checked)}
  className="w-4 h-4 accent-blue-600 cursor-pointer"
/>
        </th>

        {/* <th className="px-5 py-4 text-left font-semibold text-gray-600">#</th> */}
        <th className="px-5 py-4 text-left font-semibold text-gray-600">Name</th>
        <th className="px-5 py-4 text-left font-semibold text-gray-600">Phone</th>
        <th className="px-5 py-4 text-left font-semibold text-gray-600">
          Seminar Time
        </th>
        <th className="px-5 py-4 text-left font-semibold text-gray-600">Date</th>
        <th className="px-5 py-4 text-center font-semibold text-gray-600">
          Status
        </th>
        <th className="px-5 py-4 text-center font-semibold text-gray-600">
          Actions
        </th>
      </tr>
    </thead>

    {/* Table Body */}
    <tbody className="divide-y divide-gray-100">
      {bookings.map((b, i) => (
        <tr
          key={b._id}
          className={`hover:bg-gray-50 transition ${
            i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
          }`}
        >

            {/* Row Checkbox */}
            <td className="px-4 py-2.5 text-center">
              <input
  type="checkbox"
  checked={selectedRows.includes(b._id)}
  onChange={() => handleSelectRow(b._id)}
  className="w-4 h-4 accent-blue-600 cursor-pointer"
/>
            </td>

          {/* Serial */}
          {/* <td className="px-5 py-4 font-medium text-gray-500">
            {i + 1}
          </td> */}

          {/* Name */}
          <td className="px-5 py-4 font-semibold text-gray-900">
            {b.name}
          </td>

          {/* Phone */}
          <td className="px-5 py-4 text-gray-700">
            {b.phone}
          </td>

          {/* Seminar Time */}
          <td className="px-5 py-4 text-blue-600 font-medium">
            {b.seminarTime}
          </td>

          {/* Date */}
          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
            {b.selectedDate}
          </td>

          {/* Status */}
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

          {/* Actions */}
          <td className="px-5 py-4">
            <div className="flex flex-wrap justify-center gap-2">
              {b.status === "Not Attended" && (
                <>
                  <button
                    onClick={() =>
                      updateStatus(b._id, "Attended")
                    }
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition"
                  >
                    Mark Attended
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        b._id,
                        "Not Attended"
                      )
                    }
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
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}
