"use client";

import { Loader2, X } from "lucide-react";

const STATUSES = ["", "Hot", "Warm", "Cold"];
const SOURCES = [
  "manual-upload",
  "chatbot",
  "website",
  "Meta Lead",
  "expolead",
];

function FormInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, options, emptyLabel }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || emptyLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function EditLeadModal({
  user,
  formData,
  setFormData,
  onClose,
  onSave,
  saving,
}) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-950">Edit Lead</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            label="Full Name"
            value={formData.fullName}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, fullName: value }))
            }
            placeholder="Enter full name"
          />
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, email: value }))
            }
            placeholder="user@example.com"
          />
          <FormInput
            label="Phone"
            value={formData.phone}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, phone: value }))
            }
            placeholder="9876543210"
          />
          <FormSelect
            label="Lead Tag"
            value={formData.leadStatus}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, leadStatus: value }))
            }
            options={STATUSES}
            emptyLabel="Untagged"
          />
          <FormSelect
            label="Source"
            value={formData.source}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, source: value }))
            }
            options={SOURCES}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-gray-950 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Update Lead"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}