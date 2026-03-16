"use client";

import { useEffect, useState } from "react";
import { Search, Phone, MessageCircle, Wallet, X } from "lucide-react";

import DashboardStats from "../../../../components/FranchiseLeads/DashboardStats";
import CallPerformance from "../../../../components/FranchiseLeads/CallPerformance";
import SearchFilters from "../../../../components/FranchiseLeads/SearchFilters";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [stage, setStage] = useState("All");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    referCode: localStorage.getItem("franchise_code") || "",
    plan: "Basic",
  });

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const franchiseCode = localStorage.getItem("franchise_code");

      // Agar franchise_code nahi hai → empty
      if (!franchiseCode) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `/api/franchise-panel/franchise-user?referCode=${franchiseCode}`,
      );

      const data = await res.json();

      if (data.success) {
        let filteredUsers = data.users;

        if (search) {
          filteredUsers = filteredUsers.filter(
            (u) =>
              u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
              u.email?.toLowerCase().includes(search.toLowerCase()) ||
              u.referCode?.toLowerCase().includes(search.toLowerCase()),
          );
        }

        setUsers(filteredUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setUsers([]);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddUser = async () => {
    if (!formData.fullName || !formData.email) {
      alert("Please enter Full Name and Email");
      return;
    }

    try {
      const res = await fetch("/api/users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("User created successfully!");

        setFormData({
          fullName: "",
          email: "",
          phone: "",
          referCode: localStorage.getItem("franchise_code") || "",
          plan: "Basic",
        });

        setOpenModal(false);
        fetchUsers();
      } else {
        alert(data.error || "Failed to add user");
      }
    } catch (error) {
      console.error("Add user error:", error);
    }
  };

  // {search logic useEffect}

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pr-8">
        <h1 className="text-2xl font-bold">User Management</h1>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setOpenModal(true)}
            className="bg-dark text-white px-6 p-2 flex items-center gap-2 rounded-md text-lg font-bold hover:bg-neutral-800"
          >
            <span className="relative top-[1px] text-2xl font-bold"> +</span>{" "}
            Add user
          </button>

          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search by name, email or refer code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </div>

      <DashboardStats />
      <CallPerformance />

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left">Joined Date</th>
              <th className="px-6 py-4 text-left">User Name</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Phone</th>
              <th className="px-6 py-4 text-left">Refer Code</th>
              <th className="px-6 py-4 text-left">Lead Stage</th>

              <th className="px-6 py-4 text-left">wallet </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 font-medium">{user.fullName}</td>

                  <td className="px-6 py-4">{user.email}</td>

                  <td className="px-6 py-4">{user.phone || "—"}</td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {user.referCode}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {user.leadStage || "New"}
                    </span>
                  </td>

                  <td className="px-6 py-4 flex items-center gap-2">
                    <Wallet size={16} className="text-purple-600" />
                    <span>{user.wallet || 0} coins</span>
                  </td>
                </tr>
              ))
            )}

            {openModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Add New User
                    </h2>
                    <button
                      onClick={() => setOpenModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <X
                        size={20}
                        className="text-gray-700 dark:text-gray-300"
                      />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-4 mb-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Plan */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Plan
                      </label>
                      <select
                        value={formData.plan}
                        onChange={(e) =>
                          setFormData({ ...formData, plan: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                      >
                        <option value="Free">Free</option>
                        <option value="Basic">Basic</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setOpenModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 
                     text-gray-700 dark:text-gray-200 rounded-xl 
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleAddUser}
                      className="flex-1 px-6 py-3 bg-dark 
                     text-white rounded-xl hover:bg-neutral-800
                     transition-all font-medium"
                    >
                      Add User
                    </button>
                  </div>
                </div>
              </div>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
