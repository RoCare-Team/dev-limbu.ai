"use client";

import { User2Icon, Mail, X } from "lucide-react";

// Edit User Modal — update a lead's name and email (admin & agent).
export default function EditUserModal({
  editUserModal,
  setEditUserModal,
  editUserData,
  setEditUserData,
  savingEditUser,
  handleUpdateUserInfo,
}) {
  if (!editUserModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
          <button
            onClick={() => setEditUserModal(null)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Full Name
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl focus-within:border-indigo-400">
              <User2Icon size={16} className="text-gray-400" />
              <input
                type="text"
                value={editUserData.fullName}
                onChange={(e) =>
                  setEditUserData((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                placeholder="Enter full name"
                className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl focus-within:border-indigo-400">
              <Mail size={16} className="text-gray-400" />
              <input
                type="email"
                value={editUserData.email}
                onChange={(e) =>
                  setEditUserData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Enter email"
                className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full mt-6">
          <button
            onClick={() => setEditUserModal(null)}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateUserInfo}
            disabled={savingEditUser}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium disabled:opacity-70"
          >
            {savingEditUser ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
