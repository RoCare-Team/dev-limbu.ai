"use client";

import { Trash2 } from "lucide-react";

export default function DeleteLeadModal({ user, onClose, onConfirm, deleting }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-3">
            <Trash2 className="text-red-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-950">Delete Lead</h2>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-gray-700">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-950">
            {user.fullName || user.email}
          </span>
          ?
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}