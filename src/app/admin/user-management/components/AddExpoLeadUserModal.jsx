


// src/components/admin/AddExpoLeadUserModal.jsx
"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

export default function AddExpoLeadUserModal({
  open,
  onClose,
  onSuccess,
}) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
  fullName: "",
  phone: "",
  email: "",
  companyName: "",
  contactPerson: "",
  remarks: "",
});

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
  setForm({
    fullName: "",
    phone: "",
    email: "",
    companyName: "",
    contactPerson: "", // NEW FIELD
    remarks: "",
  });
};

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      alert("Full Name is required");
      return;
    }

    if (!form.phone.trim()) {
      alert("Phone number is required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, ""),
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        remarks: form.remarks.trim(),

          // Contact Person (Aman, Vikas, etc.)
  accountManagerName: form.contactPerson?.trim() || "",

        // Auto values
        source: "expolead",
        leadTags: ["expolead"],
        leadStage: "Active",
        leadStatus: "Hot",
      };

const res = await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  // AddExpoLeadUserModal.jsx
// body: JSON.stringify({ ... }) ko poora isse replace kar do

// 5. Final payload ka relevant part kuch aisa hoga

body: JSON.stringify({
  fullName: form.fullName.trim(),
  phone: form.phone.replace(/\D/g, ""),
  email: form.email.trim(),
  companyName: form.companyName.trim(),

  // Contact Person (Aman, Vikas, etc.)
  accountManagerName: form.contactPerson?.trim() || "",

  // Remarks
  remarks: form.remarks.trim(),

  // Source
  source: "expolead",

  // Expolead tag
  leadTags: ["expolead"],

  // Safe lead stage (schema me Expolead allowed nahi hai)
  leadStage: "Active",

  // Status
  leadStatus: "Hot",

  // Remarks history
  remarksHistory: form.remarks.trim()
    ? [
        {
          remark: form.remarks.trim(),
          createdAt: new Date(),
          addedBy: localStorage.getItem("adminName") || "Admin",
        },
      ]
    : [],
})
});

const data = await res.json();

// Console me exact response dekho
console.log("Add User API Response:", data);

// Agar API error return kare to exact message dikhao
if (!res.ok || !data.success) {
  throw new Error(data.error || data.message || "Failed to add user");
}

alert("Expo Lead added successfully!");

resetForm();
onClose?.();
onSuccess?.();// yahan fetchUsers() pass karna
    } catch (error) {
      console.error("Add user error:", error);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Expo Lead
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Full Name *"
            className="border rounded-lg px-4 py-2"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number *"
            className="border rounded-lg px-4 py-2"
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="border rounded-lg px-4 py-2"
          />

          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Company Name"
            className="border rounded-lg px-4 py-2"
          />

         <input
  name="contactPerson"
  value={form.contactPerson || ""}
  onChange={handleChange}
  placeholder="Contact Person (e.g. Aman)"
  className="border rounded-lg px-4 py-2"
/>

          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            placeholder="Remarks"
            className="border rounded-lg px-4 py-2 md:col-span-2 min-h-[100px]"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}