

// components/SelectedLeadsActionBar.jsx

"use client";

import { useState } from "react";
import {
  MessageCircle,
  Send,
  Mail,
  Smartphone,
  X,
} from "lucide-react";

export default function SelectedLeadsActionBar({
  selectedRows = [],
}) {
  // Modal state
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] =
    useState(false);

  // Don't render if nothing selected
  if (selectedRows.length === 0) return null;

  // Templates


  return (
    <>
      {/* Action Bar */}
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
          {/* WhatsApp Button */}
          <button
            onClick={() =>
              setIsWhatsappModalOpen(true)
            }
            className="bg-white text-green-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2 hover:shadow-lg transition"
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>

          {/* RCS */}
          <button className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2">
            <Send size={18} />
            RCS
          </button>

          {/* Email */}
          <button className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2">
            <Mail size={18} />
            Email
          </button>

          {/* SMS */}
          <button className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2">
            <Smartphone size={18} />
            SMS
          </button>
        </div>
      </div>

      {/* WhatsApp Modal */}
{isWhatsappModalOpen && (
  <div className="fixed inset-0 z-50 bg-black/70 p-4">
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-[460px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-[#f3efea] p-3 relative">
          
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsWhatsappModalOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Preview Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* WhatsApp Header */}
            <div className="bg-[#0f766e] px-4 py-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                W
              </div>
              <span className="text-white font-semibold text-lg">
                WhatsApp Preview
              </span>
            </div>

            {/* Message Area */}
            <div className="p-4 bg-[#f3efea]">
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-[14px] text-gray-700 leading-8 shadow-sm">
                <p className="mb-6 font-medium">
                  Hi {"{{1}}"},
                </p>

                <p className="mb-6">
                  Your service booking request has been received
                  successfully.
                </p>

                <p className="mb-6">
                  This includes your submitted booking details and
                  related service information.
                </p>

                <p className="mb-6">
                  To view your booking details and continue the
                  conversation, chat with the Limbu AI Assistant.
                </p>

                <div className="text-[11px] text-gray-400 text-right">
                  12:00 PM ✓✓
                </div>
              </div>

              {/* Chat Now */}
              <button
                type="button"
                className="w-full mt-3 bg-white border border-gray-200 rounded-xl py-3 text-lg font-semibold text-blue-500 hover:bg-gray-50 transition"
              >
                Chat Now
              </button>

              {/* Need Support */}
              <button
                type="button"
                className="w-full mt-2 bg-white border border-gray-200 rounded-xl py-3 text-lg font-semibold text-blue-500 hover:bg-gray-50 transition"
              >
                Need Support
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            type="button"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-xl flex items-center justify-center gap-3 transition-colors"
          >
            <Send className="w-5 h-5" />
            Send Message
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </>
  );
}