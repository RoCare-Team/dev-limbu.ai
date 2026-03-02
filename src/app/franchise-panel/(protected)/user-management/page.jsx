"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [franchiseCode, setFranchiseCode] = useState("");

  useEffect(() => {
    // Get franchiseCode from localStorage on mount
    const code = localStorage.getItem("franchise_code");
    setFranchiseCode(code || "");
    fetchUsers(code || "");
  }, []);

  const fetchUsers = async (referCode) => {
    setLoading(true);

    // Build URL with referCode parameter if available
    let url = "/api/franchise-panel/franchise-user";
    if (referCode) {
      url += `?referCode=${referCode}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    console.log("datadata",data);
    

    if (data.success) {
      let filteredUsers = data.users;

      // 🔍 Frontend search filter
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

  console.log("sssssssss",users);
  

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
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Refer Code</th>
              <th className="px-6 py-3 text-left">Joined</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b hover:bg-gray-50"
                >
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

                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
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
