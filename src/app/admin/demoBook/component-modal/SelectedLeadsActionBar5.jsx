

"use client";

import { useState } from "react";
import {
  MessageCircle,
  Send,
  Mail,
  Smartphone,
  X,
  Loader2,
} from "lucide-react";

export default function SelectedLeadsActionBar5({
  selectedRows = [],
  leads = [],
}) {


const [sendingFranchiseMsg, setSendingFranchiseMsg] =
  useState(false);

const [sendSuccess, setSendSuccess] =
  useState(false);

  // Modal state
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] =
    useState(false);

  // Don't render if nothing selected
  if (selectedRows.length === 0) return null;

  


  // SelectedLeadsActionBar5.jsx
// Demo Booking API ke schema me phone field ka naam "phone" hai.
// selectedRows me kabhi full object aata hai, kabhi sirf _id.
// Isliye handleSendTemplateMessage ko poora replace karo.

const handleSendTemplateMessage = async () => {
  if (!selectedRows || selectedRows.length === 0) {
    return;
  }

  let lead = null;

  // Agar selectedRows[0] full object hai
  if (
    typeof selectedRows[0] === "object" &&
    selectedRows[0] !== null
  ) {
    lead = selectedRows[0];
  } else {
    // Agar selectedRows[0] sirf _id hai
    const selectedId = String(selectedRows[0]);

    lead = leads.find(
      (item) => String(item._id) === selectedId
    );
  }

  if (!lead) {
    alert("Lead not found");
    return;
  }

  console.log("Selected Lead:", lead);

  // Demo Booking schema:
  // {
  //   name: String,
  //   phone: String,
  //   seminarTime: String,
  //   selectedDate: String,
  //   status: String
  // }

  const phone = lead.phone;
  const name = lead.name || "User";

  console.log("Phone Found:", phone);

  if (!phone) {
    alert("Phone number not found");
    return;
  }

  // Loading start
  setSendingFranchiseMsg(true);
  setSendSuccess(false);



try {
  console.log("========== WHATSAPP SEND START ==========");
  console.log("Selected Lead:", lead);
  console.log("Phone:", phone);
  console.log("Name:", name);

  const requestBody = {
    campaignName: "demo_session_confirmation1",
    users: [
      {
        customer_no_with_prefix: phone,
        name: name,
      },
    ],
  };

  console.log("Request URL:", "/api/admin/demo-session");
  console.log("Request Body:", requestBody);

  const response = await fetch("/api/admin/demo-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

 

  const data = await response.json();


  if (response.ok && data.sent > 0) {
    setSendingFranchiseMsg(false);
    setIsWhatsappModalOpen(false);
    setSendSuccess(true);
    return;
  }

  setSendingFranchiseMsg(false);

  // Exact backend message
  alert(
    data.message ||
      JSON.stringify(data.details?.[0]?.response || {}) ||
      "Failed to send template"
  );
} catch (error) {
 

  setSendingFranchiseMsg(false);

  alert(error.message || "Failed to send WhatsApp template");
}
};

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


{/* WhatsApp Modal */}
{isWhatsappModalOpen && (
  <div className="fixed inset-0 z-50 bg-black/70 p-4">
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-[430px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-[#f3efea] p-3 relative">
          
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsWhatsappModalOpen(false)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
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

            {/* Message Content */}
            <div className="p-5 text-[14px] text-gray-700 leading-8">
              <p className="mb-6 font-bold text-gray-800">
                Thank you for registering with Limbu AI.
              </p>

              <p className="mb-6">
                Your <span className="font-semibold">Live Demo Session</span> is confirmed.
              </p>

              <p className="mb-2">
                Time: {"{{1}}"}
              </p>

              <p className="mb-2">
                Join Link: {"{{2}}"}
              </p>

              <p className="mb-2">
                Meeting ID: {"{{3}}"}
              </p>

              <p className="mb-6">
                Passcode: {"{{4}}"}
              </p>

              <p className="mb-6">
                Support: 9289344726
              </p>

              <p className="mb-6 font-semibold">
                – Team Limbu AI
              </p>

              <div className="text-[12px] text-gray-400 text-right">
                12:00 PM ✓✓
              </div>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              className="w-full py-4 text-lg font-semibold text-blue-600 border-t border-gray-200 hover:bg-gray-50"
            >
              Interested
            </button>

            <button
              type="button"
              className="w-full py-4 text-lg font-semibold text-blue-600 border-t border-gray-200 hover:bg-gray-50"
            >
              Not Interested
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            type="button"
            onClick={handleSendTemplateMessage}
            disabled={sendingFranchiseMsg}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingFranchiseMsg ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {sendingFranchiseMsg ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      {/* Success Modal */}
{sendSuccess && (
  <div className="fixed inset-0 z-[60] bg-black/60 p-4">
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Template Sent Successfully
        </h3>

        {/* Message */}
        <p className="text-gray-500 mb-6">
          WhatsApp template has been sent successfully.
        </p>

        {/* OK Button */}
        <button
          type="button"
          onClick={() => setSendSuccess(false)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}