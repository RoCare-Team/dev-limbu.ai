"use client";

import { useState } from "react";
import { Crown, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

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

export default function AddLeadModal({ onClose, onSuccess, getAuthHeaders }) {
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    leadStatus: "",
    source: "manual-upload",
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      leadStatus: "",
      source: "manual-upload",
    });
    setPhoneError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    if (phoneError) setPhoneError(""); // clear error on change
  };

  const handleAddLead = async () => {
    const referCode = localStorage.getItem("franchise_code") || "";
    if (!referCode) {
      toast.error("Franchise code missing. Please log in again");
      return;
    }
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Please enter full name and email");
      return;
    }

    setSaving(true);
    setPhoneError("");

    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ...formData, referCode }),
      });
      const data = await res.json();

      if (!data.success) {
        const msg = data.error || data.message || "";
        const isDuplicatePhone =
          msg.toLowerCase().includes("phone") ||
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("duplicate") ||
          data.code === "DUPLICATE_PHONE" ||
          data.duplicateField === "phone";

        if (isDuplicatePhone) {
          // Inline field error + prominent toast
          setPhoneError(
            "This phone number is already registered with another lead."
          );
          toast.error("Phone number already registered!", {
            duration: 4000,
            icon: "📵",
          });
        } else {
          toast.error(msg || "Failed to add lead");
        }
        return;
      }

      toast.success("Lead added and assigned successfully");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Add lead error:", error);
      toast.error("Failed to add lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-950">Add New Lead</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            label="Full Name"
            value={formData.fullName}
            onChange={(value) => setFormData({ ...formData, fullName: value })}
            placeholder="Enter full name"
          />
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            placeholder="user@example.com"
          />

          {/* Phone with inline error */}
          <div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Phone
              </span>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="9876543210"
                className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none focus:ring-2 ${
                  phoneError
                    ? "border-red-400 bg-red-50 focus:ring-red-400"
                    : "border-gray-300 bg-white focus:ring-gray-900"
                }`}
              />
            </label>
            {phoneError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold leading-none">
                  !
                </span>
                {phoneError}
              </p>
            )}
          </div>

          <FormSelect
            label="Lead Tag"
            value={formData.leadStatus}
            onChange={(value) =>
              setFormData({ ...formData, leadStatus: value })
            }
            options={STATUSES}
            emptyLabel="Untagged"
          />
          <FormSelect
            label="Source"
            value={formData.source}
            onChange={(value) => setFormData({ ...formData, source: value })}
            options={SOURCES}
          />
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Crown size={16} />
          Saving this lead will assign it automatically to the next active team
          member by round robin.
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddLead}
            disabled={saving}
            className="flex-1 rounded-xl bg-gray-950 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Lead"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}