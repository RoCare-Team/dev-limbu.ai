


"use client";

import {
  MessageCircle,
  Send,
  Mail,
  Smartphone,
} from "lucide-react";

export default function SelectedLeadsActionBar3({
  selectedRows = [],
}) {
  // Don't render if nothing selected
  if (selectedRows.length === 0) return null;

  return (
    <div className="bg-emerald-500 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <MessageCircle size={24} />
        </div>

        <div>
          <p className="text-sm font-medium text-white/90">
            Selected Leads
          </p>
          <p className="text-4xl font-bold leading-none">
            {selectedRows.length}
          </p>
        </div>
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3">
        <button className="bg-white text-green-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2">
          <MessageCircle size={18} />
          WhatsApp
        </button>

        <button className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2">
          <Send size={18} />
          RCS
        </button>

        <button className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2">
          <Mail size={18} />
          Email
        </button>

        <button className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2">
          <Smartphone size={18} />
          SMS
        </button>
      </div>
    </div>
  );
}   