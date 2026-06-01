


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
  

// 5. Final payload ka relevant part kuch aisa hoga

body: JSON.stringify({
  fullName: form.fullName.trim(),
  phone: form.phone.replace(/\D/g, ""),
  email: form.email.trim(),
  companyName: form.companyName.trim(),

  // Contact Person (Aman, Vikas, etc.)
  // accountManagerName: form.contactPerson?.trim() || "",

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
        text: form.remarks.trim(),

        // 👇 REMARK DATE
        createdAt: new Date("2026-05-20T10:00:00"),

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
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-black/70 via-slate-900/60 to-purple-900/50 backdrop-blur-md flex items-center justify-center p-4  animate-fadeIn">
  <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-[0_25px_80px_rgba(88,28,135,0.35)]  animate-scaleIn">
    
    {/* Decorative Background */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
    </div>

    {/* Header */}
    <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-200/70 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
          <Plus className="w-5 h-5 text-white" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Add Expo Lead
          </h2>
          <p className="text-xs text-purple-100 mt-0.5">
            Create and assign a new expo lead
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 transition-all duration-200 hover:bg-white/25 hover:rotate-90"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Body */}
    <div className="relative p-6 md:p-7 grid grid-cols-1 md:grid-cols-2 gap-5">
      <input
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        placeholder="Full Name *"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-purple-100"
      />

      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone Number *"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-purple-100"
      />

      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-purple-100"
      />

      <input
        name="companyName"
        value={form.companyName}
        onChange={handleChange}
        placeholder="Company Name"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-purple-100"
      />

      

      <textarea
        name="remarks"
        value={form.remarks}
        onChange={handleChange}
        placeholder="Remarks"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-purple-100 md:col-span-2 min-h-[120px] resize-none"
      />
    </div>

    {/* Footer */}
    <div className="relative flex justify-end gap-3 px-6 py-5 border-t border-slate-200/70 bg-slate-50/80 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold shadow-sm transition-all duration-200 hover:bg-slate-100 hover:shadow"
      >
        Cancel
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-green-500/35 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {saving ? "Saving..." : "Save Lead"}
      </button>
    </div>
  </div>
</div>
  );
}