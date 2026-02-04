"use client";

import { useEffect, useState } from "react";
import { Search, Phone, MessageCircle, Wallet } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);

    const res = await fetch(`/api/franchise-panel/franchise-user`);
    const data = await res.json();

    if (data.success) {
      let filteredUsers = data.users;

      if (search) {
        filteredUsers = filteredUsers.filter(
          (u) =>
            u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.referCode?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setUsers(filteredUsers);
    }

    setLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or refer code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left">Joined Date</th>
              <th className="px-6 py-4 text-left">User Name</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Phone</th>
              <th className="px-6 py-4 text-left">Refer Code</th>
              <th className="px-6 py-4 text-left">Plan</th>
              <th className="px-6 py-4 text-left">Assign To</th>
              <th className="px-6 py-4 text-left">Remarks</th>
              <th className="px-6 py-4 text-left">Lead Stage</th>
              <th className="px-6 py-4 text-left">Contact</th>
              <th className="px-6 py-4 text-left">Chat</th>
              <th className="px-6 py-4 text-left">Wallet</th>
              <th className="px-6 py-4 text-left">Posts</th>
              <th className="px-6 py-4 text-left">Business Name</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="15" className="px-6 py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan="15"
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {user.fullName}
                  </td>

                  <td className="px-6 py-4">
                    {user.email}
                  </td>

                  <td className="px-6 py-4">
                    {user.phone || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {user.referCode}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {user.plan || "Free"}
                  </td>

                  <td className="px-6 py-4">
                    {user.assignTo || "—"}
                  </td>

                  <td className="px-6 py-4">
                    {user.remarks || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {user.leadStage || "New"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <Phone size={16} className="text-gray-600 cursor-pointer" />
                  </td>

                  <td className="px-6 py-4">
                    <MessageCircle
                      size={16}
                      className="text-green-600 cursor-pointer"
                    />
                  </td>

                  <td className="px-6 py-4">
                    <Wallet size={16} className="text-purple-600" />
                  </td>

                  <td className="px-6 py-4 text-center">
                    {user.posts || 0}
                  </td>

                  <td className="px-6 py-4">
                    {user.businessName || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <button className="text-sm text-blue-600 hover:underline">
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
