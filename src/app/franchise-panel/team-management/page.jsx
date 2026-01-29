"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Users,
  UserPlus,
  Crown,
  ShieldCheck,
} from "lucide-react";

export default function TeamManagement() {
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);

    // 🔥 Dummy data (API se replace hoga)
    const data = [
      {
        id: 1,
        fullName: "Limbu",
        email: "info@limbu.ai",
        role: "Master Franchise",
        status: "Active",
        joined: "2026-01-20",
      },
      {
        id: 2,
        fullName: "Parvesh",
        email: "parvesh@gmail.com",
        role: "Franchise",
        status: "Active",
        joined: "2026-01-22",
      },
      {
        id: 3,
        fullName: "Rohit",
        email: "rohit@gmail.com",
        role: "Agent",
        status: "Pending",
        joined: "2026-01-24",
      },
    ];

    setTeam(data);
    setLoading(false);
  };

  const filteredTeam = team.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">

      {/* 🔥 Header */}
      <div className="bg-black text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users />
            <span className="uppercase text-sm tracking-wide text-gray-400">
              Team Management
            </span>
          </div>

          <h1 className="text-3xl font-bold">
            Manage Your Team
          </h1>

          <p className="text-gray-400 mt-1">
            View & control franchise and agent network
          </p>
        </div>

        <button className="mt-4 md:mt-0 bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2">
          <UserPlus size={18} />
          Add Member
        </button>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Members" value="12" />
        <StatCard title="Active Members" value="9" />
        <StatCard title="Pending Invites" value="3" />
      </div>

      {/* 🔍 Search */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl w-full focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* 📋 Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">Member</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Joined</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredTeam.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                  No team members found
                </td>
              </tr>
            ) : (
              filteredTeam.map((member) => (
                <tr
                  key={member.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium">
                      {member.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.email}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <RoleBadge role={member.role} />
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={member.status} />
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {new Date(member.joined).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <button className="text-sm text-indigo-600 hover:underline">
                      View
                    </button>
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

/* ----------------- Components ----------------- */

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    "Master Franchise": "bg-yellow-100 text-yellow-700",
    Franchise: "bg-blue-100 text-blue-700",
    Agent: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs ${
        map[role] || "bg-gray-100 text-gray-600"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs ${
        status === "Active"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {status}
    </span>
  );
}
