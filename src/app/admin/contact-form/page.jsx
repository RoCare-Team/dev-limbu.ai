"use client";
import { useEffect, useState } from "react";

import SelectedLeadsActionBar3 from "./component-modal/SelectedLeadsActionBar3"

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRows, setSelectedRows] = useState([]);

// Select all rows
const handleSelectAll = (checked) => {
  if (checked) {
    setSelectedRows(leads.map((lead) => lead._id));
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

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/contact-form", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setLeads(data.data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        📋 Contact Leads
      </h1>

      {loading ? (
        <p className="text-center text-lg font-medium text-gray-600">
          Loading leads...
        </p>
      ) : leads.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No leads found.</p>
      ) : (
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6">

  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Leads</h2>
      <p className="text-sm text-gray-500">Manage all incoming leads</p>
    </div>

    <div className="bg-black text-white text-sm px-4 py-1.5 rounded-full">
      {leads.length} Total
    </div>
  </div>

  {/* Table Wrapper */}
  <div className="overflow-x-auto rounded-2xl border border-gray-100">

    <>


{selectedRows.length > 0 && (
  <SelectedLeadsActionBar3
    selectedRows={selectedRows}
    leads={leads}
  />
)}

         <table className="min-w-full">

      {/* THEAD */}
      <thead>
        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-xs uppercase tracking-wider">

           {/* Select All Checkbox */}
        <th className="py-4 px-6 text-center">
          <input
            type="checkbox"
            checked={
              leads.length > 0 &&
              selectedRows.length === leads.length
            }
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </th>
          <th className="py-4 px-6 text-left font-semibold">Name</th>
          
          <th className="py-4 px-6 text-left font-semibold">Phone</th>
          <th className="py-4 px-6 text-left font-semibold">Email</th>
          <th className="py-4 px-6 text-left font-semibold">Message</th>
          <th className="py-4 px-6 text-left font-semibold">Date</th>
        </tr>
      </thead>

      {/* TBODY */}
      <tbody className="divide-y divide-gray-100">

        {leads.map((lead, index) => (
          <tr
            key={lead._id}
            className="group hover:bg-gray-50 transition duration-200"
          >

              {/* Row Checkbox */}
          <td className="py-4 px-6 text-center">
            <input
              type="checkbox"
              checked={selectedRows.includes(lead._id)}
              onChange={() => handleSelectRow(lead._id)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </td>

            {/* Name + Avatar */}
            <td className="py-4 px-6">
  <div className="flex items-center gap-4">

    {/* Avatar */}
    <div className="w-11 h-11 flex items-center justify-center rounded-full 
    bg-black text-white text-sm font-semibold 
    shadow-md ring-2 ring-gray-200">
      {lead.name?.charAt(0)}
    </div>

    {/* Name */}
    <span className="font-semibold text-gray-800">
      {lead.name}
    </span>

  </div>
</td>

             {/* Phone */}
            <td className="py-4 px-6">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                {lead.phone}
              </span>
            </td>

            {/* Email */}
            <td className="py-4 px-6 text-gray-600 group-hover:text-black transition">
              {lead.email}
            </td>

           

            {/* Message */}
            <td className="py-4 px-6 max-w-xs">
              <p className="text-gray-600 text-sm line-clamp-1">
                {lead.message}
              </p>
            </td>



            {/* Date */}
            <td className="py-4 px-6 text-gray-500 text-sm whitespace-nowrap">
              {new Date(lead.createdAt).toLocaleString("en-IN")}
            </td>

          </tr>
        ))}

      </tbody>
    </table>
    </>

   
  </div>
</div>
      )}
    </div>
  );
}
