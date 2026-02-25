"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Power, Trash2 } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";

/* ----------------------------
   PERMISSION LABELS
---------------------------- */
const PERMISSION_LABELS = {
  manageUsers: "User Management",
  manageTeam: "Team Management",
  manageLeads: "Leads / Contact / FB / Demo",
  manageFranchise: "Franchise Leads",
  seeAnalytics: "Settings / Analytics",
};

export default function UsersPage() {9
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("list");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "agent",
    permissions: {
      manageUsers: true,
      manageTeam: false,
      manageLeads: false,
      manageFranchise: false,
      seeAnalytics: false,
    },
  });

  /* ----------------------------
     FETCH USERS
  ---------------------------- */
  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/adminLogin");
      return;
    }

    fetch("/api/users/list", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.users || []);
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`/api/users/add?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data.success) {
      setUsers(prev => prev.filter(u => u._id !== id));
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
};

const toggleStatus = async (id, currentStatus) => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/users/create?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isActive: !currentStatus,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setUsers(prev =>
        prev.map(u =>
          u._id === id ? { ...u, isActive: !currentStatus } : u
        )
      );
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
};

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert("Copied: " + text);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ----------------------------
     SUBMIT USER
  ---------------------------- */
  const submit = async () => {
    await fetch("/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });

    alert("User Created Successfully");
    setActiveTab("list");
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">

      {/* TABS */}
      <div className="max-w-5xl mx-auto mb-6 flex gap-4">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-2 rounded-lg font-medium ${
            activeTab === "list"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Users List
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`px-5 py-2 rounded-lg font-medium ${
            activeTab === "add"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Add User
        </button>
      </div>

      {/* USERS LIST TAB */}
      {activeTab === "list" && (
        <div className="max-w-8xl mx-auto bg-white rounded-2xl shadow-lg p-6">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Users List
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-24 h-24">
                <Lottie animationData={animationData} loop={true} />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Email</th>
                    <th className="border px-4 py-2 text-left">Password</th>
                    <th className="border px-4 py-2 text-left">Role</th>
                    <th className="border px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{u.fullName}</td>
                      <td className="border px-4 py-2">{u.email}</td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{u.password}</span>
                          <button onClick={() => copyToClipboard(u.password)} className="text-gray-400 hover:text-blue-600" title="Copy Password">
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="border px-4 py-2 capitalize">{u.role}</td>
                      <td className="border px-4 py-2">
                        {u.isActive ? (
                          <span className="text-green-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-600 font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
  <div className="flex items-center gap-3">

    {/* Activate / Deactivate */}
    <button
      onClick={() => toggleStatus(u._id, u.isActive)}
      className={`p-2 rounded-full transition ${
        u.isActive
          ? "bg-green-100 text-green-600 hover:bg-green-200"
          : "bg-red-100 text-red-600 hover:bg-red-200"
      }`}
      title={u.isActive ? "Deactivate" : "Activate"}
    >
      <Power size={16} />
    </button>

    {/* Delete */}
    <button
      onClick={() => handleDelete(u._id)}
      className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition"
      title="Delete User"
    >
      <Trash2 size={16} />
    </button>

  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD USER TAB */}
      {activeTab === "add" && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Create New User
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Add a user with role-based sidebar permissions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                placeholder="John Doe"
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                placeholder="john@example.com"
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Role</label>
              <select
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="superAdmin">Super Admin</option>
                <option value="superFranchiseAdmin">Super Franchise Admin</option>
                <option value="franchiseAdmin">Franchise Admin</option>
                <option value="admin">Admin</option>
                <option value="subadmin">Sub Admin</option>
                <option value="manager">Account Manager</option>
                <option value="agent">Agent</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>

          {/* PERMISSIONS */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-4">
              Sidebar Permissions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(PERMISSION_LABELS).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        permissions: {
                          ...form.permissions,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700">
                    {PERMISSION_LABELS[key]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={submit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow transition"
            >
              Create User
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
