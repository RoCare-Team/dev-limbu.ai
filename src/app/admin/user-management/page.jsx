"use client";
import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, X, Crown, Zap, Shield, Mail, Phone, Calendar, Edit2, Trash2, Plus, User, User2Icon, Image as ImageIcon, Eye, ZoomIn, Wallet, ChevronLeft, ChevronRight } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ userId: "", email: "", phone: "", plan: "Basic" });
  const [viewingUserPosts, setViewingUserPosts] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [connectedBusinessUsers, setConnectedBusinessUsers] = useState([]);
  const [updatingWallet, setUpdatingWallet] = useState(false);
  const [walletModalUser, setWalletModalUser] = useState(null);
  const [walletUpdate, setWalletUpdate] = useState({ amount: "", type: "credit", reason: "" });
  const [toast, setToast] = useState(null);
  const [userPostsData, setUserPostsData] = useState({});
  const [mergedUsers, setMergedUsers] = useState([]);
  const [impersonatingUser, setImpersonatingUser] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [stats, setStats] = useState({
    total: 0,
    basic: 0,
    standard: 0,
    premium: 0,
    active: 0
  });

  useEffect(() => {
    const total = pagination?.totalUsers ?? 0; // Use 0 if pagination is not yet available
    // Calculate basic, standard, premium from the currently loaded users
    const basic = users.filter(u => u.subscription?.plan === "Basic").length;
    const standard = users.filter(u => u.subscription?.plan === "Standard").length;
    const premium = users.filter(u => u.subscription?.plan === "Premium").length;
    const active = connectedBusinessUsers.length;

    setStats({ total, basic, standard, premium, active });
  }, [pagination, users, connectedBusinessUsers]);


  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage,
      limit: 70,
      search: searchQuery,
      status: filterStatus,
      date: filterDate,
    });
    try {
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) { setUsers(data.users); setPagination(data.pagination); }
      return data.success ? data.users : [];
    } catch (err) {
      console.error("Error fetching users:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce search/filter requests
    return () => clearTimeout(handler);
  }, [currentPage, searchQuery, filterStatus, filterDate]);
  const mergeAllData = useCallback(async () => {
    setLoading(true);
    const initialUsers = await fetchUsers();
    if (!initialUsers || initialUsers.length === 0) {
      setLoading(false);
      return;
    }

    const businessPromises = initialUsers.map(usr =>
      fetch(`/api/admin/saveBussiness?email=${usr.email}`).then(res => res.json())
    );

    const businessResults = await Promise.all(businessPromises);

    const finalUsers = initialUsers.map((usr, index) => {
      const businessData = businessResults[index];
      const business = businessData?.listings?.find(item => item?.userEmail?.toLowerCase() === usr.email.toLowerCase());
      return {
        ...usr,
        isBusinessConnected: !!business,
        businessListings: business?.listings || [],
      };
    });

    setUsers(finalUsers);
    setLoading(false);
  }, []);

  useEffect(() => {
    mergeAllData();
    fetchConnectedBusinessUsers();
  }, [mergeAllData]);

  useEffect(() => {
    fetchAllUserPostsCounts();
  }, [users]); // Trigger when users (current page) change

  const fetchConnectedBusinessUsers = async () => {
    try {
      const res = await fetch(`/api/connectedBussiness`);
      const data = await res.json();
      if (data.success && data.users) {
        setConnectedBusinessUsers(data.users);
      }
    } catch (err) {
      console.error("Error fetching connected business users:", err);
    }
  };

  const fetchAllUserPostsCounts = async () => {
    if (users.length === 0) return;

    try {
      const userIds = users.map(user => user.userId);
      const res = await fetch('/api/post-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      const result = await res.json();

      if (result.success) {
        const countsData = result.data;
        // Ensure all users have an entry, even if they have 0 posts
        const fullPostData = userIds.reduce((acc, userId) => {
          acc[userId] = countsData[userId] || { total: 0, posted: 0, approved: 0, rejected: 0, pending: 0 };
          return acc;
        }, {});
        setUserPostsData(fullPostData);
      } else {
        // Handle error case, maybe set all to 0
        const zeroData = userIds.reduce((acc, userId) => {
          acc[userId] = { total: 0, posted: 0, approved: 0, rejected: 0, pending: 0 };
          return acc;
        }, {});
        setUserPostsData(zeroData);
        console.error("Failed to fetch bulk post counts:", result.error);
      }
    } catch (err) {
      console.error("Error fetching posts counts:", err);
    }
  };

  // When filters change, reset to the first page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterDate]);



  const isUserConnected = (email) => {
    return connectedBusinessUsers.some(
      (connectedUser) => connectedUser.email?.toLowerCase() === email?.toLowerCase()
    );
  };

  const handleUpgradePlan = (user) => {
    setSelectedUser(user);
    setSelectedPlan(user.subscription?.plan || "Basic");
  };

  const confirmPlanChange = async () => {
    if (!selectedUser || !selectedPlan) return;
    setUpdating(selectedUser.userId);

    try {
      const res = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.userId,
          newPlan: selectedPlan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        setSelectedUser(null);
      } else {
        alert(data.error || "Failed to update plan");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("User deleted successfully");
        fetchUsers();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email) {
      alert("Please enter Full Name and Email");
      return;
    }

    try {
      const res = await fetch("/api/users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (data.success) {
        alert("User created successfully!");

        setNewUser({
          fullName: "",
          email: "",
          phone: "",
          plan: "Free",
        });

        setAddingUser(false);
        fetchUsers();
      } else {
        alert(data.error || "Failed to add user");
      }
    } catch (error) {
      console.error("Add user error:", error);
    }
  };


  const handleViewPosts = async (user) => {
    setViewingUserPosts(user);
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/post-status?userId=${user.userId}`);
      const data = await res.json();
      if (data.success) {
        setUserPosts(data.data || []);
      } else {
        setUserPosts([]);
      }
    } catch (err) {
      console.error("Error fetching user posts:", err);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleOpenWalletModal = (user) => {
    setWalletModalUser(user);
    setWalletUpdate({ amount: "", type: "credit", reason: "" });
  };

  const handleUpdateWallet = async () => {
    if (!walletModalUser || !walletUpdate.amount || !walletUpdate.reason) {
      showToast("Please fill in all fields", "error");
      return;
    }

    const amount = parseFloat(walletUpdate.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setUpdatingWallet(true);

    try {
      const walletRes = await fetch(`/api/auth/signup?userId=${walletModalUser.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          type: walletUpdate.type === "credit" ? "add" : "deduct",
          reason: walletUpdate.reason
        }),
      });

      const walletData = await walletRes.json();

      if (walletData.message || walletData.success) {
        const newBalance = walletData.wallet || walletData.newBalance;
        showToast(`${walletData.message || "Wallet updated successfully"}! New balance: ${newBalance} coins`, "success");
        setWalletModalUser(null);
        setWalletUpdate({ amount: "", type: "credit", reason: "" });
        fetchUsers();
      } else {
        showToast(walletData.error || "Failed to update wallet", "error");
      }
    } catch (err) {
      console.error("Error updating wallet:", err);
      showToast("An error occurred while updating the wallet", "error");
    } finally {
      setUpdatingWallet(false);
    }
  };
  const AdminPanelButton = async (userId) => {
    setImpersonatingUser(userId);

    try {
      const adminToken = localStorage.getItem("adminToken");

      console.log("🔍 Admin Token Sent:", adminToken);

      if (!adminToken) {
        alert("Admin token missing. Please login as admin again.");
        return;
      }

      const res = await fetch("/api/admin/login-as-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      console.log("🔍 Response Status:", res.status);

      const data = await res.json();

      console.log("🔍 API Response:", data);

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        setImpersonatingUser(null);
        return;
      }

      if (data?.token) {
        // Save User Token
        localStorage.setItem("token", data.token);
        localStorage.setItem("impersonatedUser", userId);
        localStorage.setItem("userId", data.user.userId);

        window.location.href = "/dashboard";
      } else {
        alert("Unable to impersonate user");
      }
    } catch (error) {
      console.log("❌ Frontend error:", error);
      setImpersonatingUser(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("All");
    setFilterDate("All");
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Since we are doing server-side filtering, filteredUsers is just users.
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5">
          <div
            className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
              }`}
          >
            {toast.type === "success" ? (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="hover:bg-white/10 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage subscriptions and user accounts</p>
          </div>
          <button
            onClick={() => setAddingUser(true)}
            className="
    flex items-center gap-2 px-6 py-3 
    bg-gradient-to-r from-indigo-600 to-purple-600 
    hover:from-indigo-700 hover:to-purple-700 
    text-white dark:text-white        /* ⭐ Always visible text */
    rounded-xl shadow-lg 
    hover:shadow-xl 
    transition-all
  "
          >
            <Plus size={20} className="text-white dark:text-white" />
            Add User
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <User className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 shadow-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-medium">Total Wallet</p>
                <p className="text-3xl font-bold text-emerald-800 mt-1">
                  {users.reduce((sum, u) => sum + (u.wallet || 0), 0)}
                </p>
              </div>
              <Wallet className="text-emerald-600" size={24} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium">Total Posts</p>
                <p className="text-3xl font-bold text-blue-800 mt-1">
                  {Object.values(userPostsData).reduce((sum, data) => sum + data.total, 0)}
                </p>
              </div>
              <ImageIcon className="text-blue-600" size={24} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium">New user Today</p>
                <p className="text-3xl font-bold text-purple-800 mt-1">
                  {users.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 shadow-lg border border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-700 text-sm font-medium">Avg. Wallet</p>
                <p className="text-3xl font-bold text-pink-800 mt-1">
                  {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.wallet || 0), 0) / users.length) : 0}
                </p>
              </div>
              <Zap className="text-pink-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by email, user ID, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer min-w-[150px]"
              >
                <option value="All">All Status</option>
                <option value="active">Connected</option>
                <option value="inactive">Not Connected</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-11 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer min-w-[180px]"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">This Month</option>
              </select>
            </div>

            {(searchQuery || filterStatus !== "All" || filterDate !== "All") && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <X size={18} />
                Clear
              </button>
            )}
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col max-h-[70vh]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Wallet</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Posts</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Business Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">GST Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Login Button</th>
                </tr>
              </thead>
              </table>
              </div>
              <div className="overflow-y-auto flex-grow">
              <table className="min-w-full">
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const postData = userPostsData[user.userId] || { total: 0, posted: 0, rejected: 0 };
                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewPosts(user)}
                    >
                      <td className="px-6 py-4">
                        {user.businessListings && user.businessListings.length > 0 ? (

                          <div>
                            <div className="font-semibold text-gray-800">
                              {user.businessListings[0].title}  {user.businessListings[0].address.locality}
                            </div>
                            {user.businessListings.length > 1 && (
                              <Link
                                href={`/admin/user-listings?userId=${user.userId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-blue-600 hover:underline mt-1"
                              >
                                View More ({user.businessListings.length - 1})
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            Waiting......
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {user.fullName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User2Icon size={14} className="text-gray-400" />
                              {user.fullName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail size={14} className="text-gray-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} className="text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWalletModal(user);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-lg hover:from-emerald-100 hover:to-green-100 transition-all border border-emerald-200"
                          >
                            <Wallet size={16} />
                            <span className="font-bold text-base">{user.wallet || 0}</span>
                            <span className="text-xs font-medium">coins</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-3 py-2 border border-indigo-200">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-xs text-gray-600">Total</p>
                                <p className="text-lg font-bold text-indigo-600">{postData.total}</p>
                              </div>
                              <div className="w-px h-8 bg-gray-300"></div>
                              <div className="text-center">
                                <p className="text-xs text-green-600">Posted</p>
                                <p className="text-lg font-bold text-green-600">{postData.posted}</p>
                              </div>
                              <div className="w-px h-8 bg-gray-300"></div>
                              <div className="text-center">
                                <p className="text-xs text-red-600">Rejected</p>
                                <p className="text-lg font-bold text-red-600">{postData.rejected}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isUserConnected(user.email)
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${isUserConnected(user.email) ? "bg-blue-500 animate-pulse" : "bg-gray-400"
                            }`}></div>
                          {isUserConnected(user.email) ? "Connected" : "Not Connected"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {user.gst ? (
                            <div className="flex items-center gap-2 text-sm text-gray-700">

                              {/* GST Icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-blue-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 8a6 6 0 11-12 0 6 6 0 0112 0z"
                                />
                              </svg>

                              {/* GST Number */}
                              <span>{user.gst}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No GST added</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <div className="text-sm text-gray-700">
                            {user.createdAt ? (
                              <>
                                <div className="font-medium">
                                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })}
                                </div>
                                {new Date(user.createdAt).toDateString() === new Date().toDateString() && (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs text-blue-700 bg-blue-100 rounded-full font-semibold">
                                    Today
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </div>
                        </div>
                      </td>




                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPosts(user);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                          title="View Details"
                        >
                          <Eye size={16} />
                          <span className="text-sm font-medium">View Details</span>
                        </button> */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.userId);
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            AdminPanelButton(user.userId);
                          }}
                          disabled={impersonatingUser === user.userId}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-32 text-center disabled:bg-blue-400"
                        >
                          {impersonatingUser === user.userId ? (
                            <div className="flex justify-center items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            </div>
                          ) : (
                            "Login as User"
                          )}
                        </button>
                      </td>




                    </tr>

                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-12">
                      <div className="text-gray-400">
                        <Search size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-b-2xl border-t border-gray-200">
              <span className="text-sm text-gray-600">
                Page <span className="font-semibold">{pagination.currentPage}</span> of <span className="font-semibold">{pagination.totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-600">
                Total Users: <span className="font-semibold">{pagination.totalUsers}</span>
              </span>
            </div>
          )}
        </div>

        {/* Wallet Update Modal */}
        {walletModalUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                    <Wallet className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Update Wallet</h2>
                </div>
                <button
                  onClick={() => setWalletModalUser(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-0.5">User</p>
                <p className="font-semibold text-sm text-gray-800">{walletModalUser.email}</p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">Current Balance</p>
                  <p className="text-xl font-bold text-emerald-600">{walletModalUser.wallet || 0} coins</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${walletUpdate.type === "credit"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="credit"
                        checked={walletUpdate.type === "credit"}
                        onChange={(e) => setWalletUpdate({ ...walletUpdate, type: e.target.value })}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <Plus className={`mx-auto mb-0.5 ${walletUpdate.type === "credit" ? "text-green-600" : "text-gray-400"}`} size={18} />
                        <span className={`text-sm font-semibold ${walletUpdate.type === "credit" ? "text-green-700" : "text-gray-600"}`}>
                          Add
                        </span>
                      </div>
                    </label>
                    <label
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${walletUpdate.type === "debit"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="debit"
                        checked={walletUpdate.type === "debit"}
                        onChange={(e) => setWalletUpdate({ ...walletUpdate, type: e.target.value })}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <X className={`mx-auto mb-0.5 ${walletUpdate.type === "debit" ? "text-red-600" : "text-gray-400"}`} size={18} />
                        <span className={`text-sm font-semibold ${walletUpdate.type === "debit" ? "text-red-700" : "text-gray-600"}`}>
                          Deduct
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (Coins)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={walletUpdate.amount}
                    onChange={(e) => setWalletUpdate({ ...walletUpdate, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Reason</label>
                  <input
                    type="text"
                    placeholder="e.g., admin add by bonus"
                    value={walletUpdate.reason}
                    onChange={(e) => setWalletUpdate({ ...walletUpdate, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {walletUpdate.amount && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-0.5">New Balance Preview</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {walletUpdate.type === "credit"
                        ? (parseFloat(walletModalUser.wallet || 0) + parseFloat(walletUpdate.amount || 0)).toFixed(2)
                        : (parseFloat(walletModalUser.wallet || 0) - parseFloat(walletUpdate.amount || 0)).toFixed(2)}{" "}
                      coins
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setWalletModalUser(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateWallet}
                  disabled={updatingWallet}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {updatingWallet ? "Updating..." : "Update Wallet"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Upgrade Plan</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">User</p>
                <p className="font-semibold text-gray-800">{selectedUser.email}</p>
              </div>

              <div className="space-y-3 mb-6">
                {["Basic", "Standard", "Premium"].map((plan) => (
                  <label
                    key={plan}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPlan === plan
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={plan}
                        checked={selectedPlan === plan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <div className="flex items-center gap-2">
                        {plan === "Premium" && <Crown size={18} className="text-purple-600" />}
                        {plan === "Standard" && <Zap size={18} className="text-blue-600" />}
                        {plan === "Basic" && <Shield size={18} className="text-gray-600" />}
                        <span className="font-semibold text-gray-800">{plan}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPlanChange}
                  disabled={updating === selectedUser.userId}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50"
                >
                  {updating === selectedUser.userId ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
        {addingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Add New User
                </h2>
                <button
                  onClick={() => setAddingUser(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-700 dark:text-gray-300" />
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
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
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
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
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
                    value={newUser.plan}
                    onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })}
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
                  onClick={() => setAddingUser(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 
                     text-gray-700 dark:text-gray-200 rounded-xl 
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddUser}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 
                     text-white rounded-xl hover:from-green-700 hover:to-emerald-700 
                     transition-all font-medium"
                >
                  Add User
                </button>
              </div>

            </div>
          </div>
        )}
        {viewingUserPosts && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">User Posts</h2>
                  <p className="text-gray-600 text-sm mt-1">{viewingUserPosts.email}</p>
                </div>
                <button
                  onClick={() => {
                    setViewingUserPosts(null);
                    setUserPosts([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {viewingUserPosts.wallet || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Posts</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {loadingPosts ? "..." : userPosts.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Posted</p>
                    <p className="text-2xl font-bold text-green-600">
                      {loadingPosts ? "..." : userPosts.filter(p => p.status === "posted").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">
                      {loadingPosts ? "..." : userPosts.filter(p => p.status === "rejected").length}
                    </p>
                  </div>
                  {/* <div>
                    <p className="text-sm text-gray-600 mb-1">Plan</p>
                    <p className="text-2xl font-bold text-pink-600">
                      {viewingUserPosts.subscription?.plan || "Basic"}
                    </p>
                  </div> */}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No posts yet</p>
                    <p className="text-gray-400 text-sm">This user hasn't created any posts</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPosts.map((post, index) => (
                      <div
                        key={post._id || index}
                        className="relative group bg-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                      >
                        <div className="aspect-square relative">
                          <img
                            src={post.aiOutput}
                            alt={`Post ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setFullViewImage(post.aiOutput)}
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='16' text-anchor='middle' dy='.3em' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />

                          <div className="absolute top-2 right-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${post.status === "posted"
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : post.status === "rejected"
                                    ? "bg-red-100 text-red-700 border border-red-300"
                                    : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${post.status === "posted"
                                    ? "bg-green-500"
                                    : post.status === "rejected"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                  }`}
                              ></div>
                              {post.status === "posted" ? "Posted" : post.status === "rejected" ? "Rejected" : "Pending"}
                            </span>
                          </div>

                          <button
                            onClick={() => setFullViewImage(post.aiOutput)}
                            className="absolute top-2 left-2 p-2 bg-white/90 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ZoomIn size={16} className="text-gray-700" />
                          </button>
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Post #{index + 1}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {post.promat && (
                            <p className="text-sm text-gray-700 line-clamp-2">
                              <span className="font-bold">Prompt:</span> {post.promat}
                            </p>
                          )}
                          {post.status === "rejected" && post.rejectReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                              <p className="text-xs text-red-600">{post.rejectReason}</p>
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setViewingUserPosts(null);
                    setUserPosts([]);
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {fullViewImage && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setFullViewImage(null)}
          >
            <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center">
              <button
                onClick={() => setFullViewImage(null)}
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm z-10"
              >
                <X size={24} />
              </button>
              <img
                src={fullViewImage}
                alt="Full view"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
    </div>
  );
}