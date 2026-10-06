"use client";

import { X } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Add New User modal).
// Behaviour is unchanged — only moved into its own component.
export default function AddUserModal({
  addingUser,
  setAddingUser,
  newUser,
  setNewUser,
  handleAddUser,
  // Same list the table's assign dropdown uses (/api/admin/user-agent).
  agents = [],
}) {
  if (!addingUser) return null;

  return (
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
              onChange={(e) =>
                setNewUser({ ...newUser, fullName: e.target.value })
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
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
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
              value={newUser.phone}
              onChange={(e) =>
                setNewUser({ ...newUser, phone: e.target.value })
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
              value={newUser.plan}
              onChange={(e) =>
                setNewUser({ ...newUser, plan: e.target.value })
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

          {/* Assign To — the lead starts out owned by someone instead of
              sitting unassigned until an admin remembers to pick an agent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To
            </label>
            <select
              value={newUser.assignedAgentId || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, assignedAgentId: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700
                  bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
                  rounded-xl focus:ring-2 focus:ring-indigo-500
                  focus:border-transparent outline-none"
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.fullName || agent.email}
                  {agent.role ? ` · ${agent.role}` : ""}
                </option>
              ))}
            </select>
            {agents.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                No agents available to assign right now.
              </p>
            )}
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
  );
}
