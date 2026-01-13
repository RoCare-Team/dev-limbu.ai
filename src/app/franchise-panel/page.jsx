"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState(true);

  useEffect(() => {
    fetch("/api/franchise/dashboard")
      .then(res => res.json())
      .then(data => setStats(data.data));
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <div className="space-y-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Total Leads" value={stats.totalLeads} />
        <StatCard title="Videos Generated" value={stats.totalVideos} />
        <StatCard title="WhatsApp Sent" value={stats.whatsappSent} />
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Leads</h2>
          <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Source</th>
                <th className="p-3">Refer Code</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              <LeadRow 
                name="Rahul Sharma" 
                phone="9876543210" 
                source="Website" 
                referCode="FRN123"
                status="New" 
              />
              <LeadRow 
                name="Neha Verma" 
                phone="9123456780" 
                source="WhatsApp" 
                referCode="FRN456"
                status="Follow-up" 
              />
              <LeadRow 
                name="Amit Kumar" 
                phone="9012345678" 
                source="Facebook" 
                referCode="FRN789"
                status="Converted" 
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="flex flex-wrap gap-4">
          <SmallActionBtn label="Generate Video" />
          <SmallActionBtn label="Send WhatsApp" />
          <SmallActionBtn label="Add User" />
        </div>
      </div>

    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:scale-105 transition">
      <p className="text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  );
}

function LeadRow({ name, phone, source, referCode, status }) {
  const statusStyles = {
    "New": "bg-green-100 text-green-700",
    "Follow-up": "bg-yellow-100 text-yellow-700",
    "Converted": "bg-blue-100 text-blue-700",
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-3 font-medium">{name}</td>
      <td className="p-3">{phone}</td>
      <td className="p-3">{source}</td>
      <td className="p-3 font-mono text-sm text-purple-600">{referCode}</td>
      <td className="p-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
          {status}
        </span>
      </td>
      <td className="p-3 text-center space-x-2">
        <button className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700">
          Assign
        </button>
        <button className="bg-gray-200 px-3 py-1 rounded text-xs hover:bg-gray-300">
          View
        </button>
      </td>
    </tr>
  );
}

function SmallActionBtn({ label }) {
  return (
    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
      {label}
    </button>
  );
}
