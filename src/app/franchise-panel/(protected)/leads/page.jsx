"use client";

import { useEffect, useState } from "react";
import { Search, Phone, MessageCircle, Wallet, X } from "lucide-react";

import DashboardStats from "../../../../components/FranchiseLeads/DashboardStats";
import RemarksModal from "../../../../components/FranchiseLeads/RemarksModal";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [stage, setStage] = useState("All");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [agents, setAgents] = useState([]);

  const [toast, setToast] = useState("");

  const [remarksUser, setRemarksUser] = useState(null);
  const [remarksHistory, setRemarksHistory] = useState([]);

  const handleAssignChange = async (userId, agentId) => {
    // UI update
    setUsers((prev) =>
      prev.map((u) =>
        u._id === user._id || u.userId === user.userId
          ? { ...u, remarksHistory: data.user.remarksHistory }
          : u,
      ),
    );

    try {
      await fetch("/api/franchise-panel/franchise-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, agentId }),
      });

      showToast("Agent assigned successfully");
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg) => {
    setToast(msg);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const getAgentName = (agent) => {
    if (!agent) return "Unassigned";
    if (typeof agent === "object") return agent.fullName;
    return agents.find((a) => a._id === agent)?.fullName || "Unassigned";
  };

  const getAvatarColor = (name) => {
    if (!name || name === "Unassigned") return "border-gray-300 text-gray-500";
    return "border-green-300 text-green-600";
  };

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    referCode: localStorage.getItem("franchise_code") || "",
    plan: "Basic",
  });

  useEffect(() => {
    fetchUsers();
    fetchAgents();
  }, [search]);

  useEffect(() => {
    setAgents([
      { _id: "1", fullName: "Aman" },
      { _id: "2", fullName: "Vikas nagar" },
      { _id: "3", fullName: "MannuBhai" },
    ]);
  }, []);

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

  const fetchAgents = async () => {
    try {
      const franchiseCode = localStorage.getItem("franchise_code"); // ⭐ ADD THIS

      const res = await fetch(
        `/api/admin/get-agents?referCode=${franchiseCode}`,
      );
      const data = await res.json();

      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error("Agents fetch error:", error);
    }
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

  const openRemarks = async (user) => {
    setRemarksUser(user);

    const userId = user?._id || user?.userId;

    if (!userId) {
      console.error("User ID missing ❌");
      return;
    }

    const res = await fetch(
      `/api/franchise-panel/franchise-user?userId=${userId}`,
    );

    const data = await res.json();

    if (data.success) {
      setRemarksHistory(data?.user?.remarksHistory || []);
    }
  };

  // {search logic useEffect}

  return (
    <div className="p-6">
      <div>
        {toast && (
          <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            ✅ {toast}
          </div>
        )}
      </div>

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
            <Search className="absolute left-3 top-2.5 text-dark" size={18} />

            <input
              type="text"
              placeholder="Search by name, email or refer code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-dark focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </div>

      <DashboardStats />
      <RemarksModal
        user={remarksUser}
        onClose={() => setRemarksUser(null)}
        remarksHistory={remarksUser?.remarksHistory}
        setRemarksHistory={setRemarksHistory}
        fetchUsers={fetchUsers}
        setUsers={setUsers}
        setRemarksUser={setRemarksUser}
        showToast={showToast}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left">Joined Date</th>
              <th className="px-6 py-4 text-left">User Name</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-3 text-left">ASSIGNED AGENT</th>
              <th className="px-6 py-3 text-left">Remark add</th>
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
                <td colSpan="9" className="px-6 py-8 text-center text-dark">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 font-medium text-dark">
                    {user.fullName}
                  </td>

                  <td className="px-6 py-4 text-dark">{user.email}</td>
                  <td
                    className="px-6 py-5 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`relative inline-flex items-center rounded-full border px-2 ${getAvatarColor(
                        getAgentName(user.assignedAgentId),
                      )}`}
                    >
                      <select
                        className="appearance-none bg-transparent px-3 py-1 pr-6 text-xs font-semibold focus:outline-none cursor-pointer"
                        value={
                          user.assignedAgentId?._id ||
                          (typeof user.assignedAgentId === "string" &&
                            user.assignedAgentId) ||
                          ""
                        }
                        onChange={(e) =>
                          handleAssignChange(user.userId, e.target.value)
                        }
                      >
                        <option value="">-- Unassigned --</option>

                        {agents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.fullName}
                          </option>
                        ))}
                      </select>

                      <span className="pointer-events-none absolute right-1">
                        ▼
                      </span>
                    </div>
                  </td>

                  <div className="bg-gray-200 p-1.5 flex justify-center rounded-2xl">
                    <button onClick={() => openRemarks(user)}>
                      <span>💬 {user?.remarksHistory?.length || 0}</span>
                    </button>
                  </div>

                  <td className="px-6 py-4 text-dark">{user.phone || "—"}</td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-dark bg-gray-100 px-2 py-1 rounded">
                      {user.referCode}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {user.leadStage || "New"}
                    </span>
                  </td>

                  <td className="px-6 py-4 flex items-center gap-2">
                    <Wallet size={16} className="text-dark" />
                    <div className="w-fit bg-gray-100 border border-gray-300 px-2 py-1 rounded-lg">
                      <span className="text-dark whitespace-nowrap">
                        {user.wallet || 0} coins
                      </span>
                    </div>
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
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-dark 
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
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-800 
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
