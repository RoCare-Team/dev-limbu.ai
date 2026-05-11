
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

  export default function SelectedLeadsActionBar3({
    selectedRows = [],
    leads = [],
  }) {

    // SelectedLeadsActionBar3.jsx me ye state add karo
// isWhatsappModalOpen ke just neeche



const [isWhatsappTemplateModalOpen, setIsWhatsappTemplateModalOpen] =
  useState(false);

const [sendingFranchiseMsg, setSendingFranchiseMsg] =
  useState(false);

const [sendSuccess, setSendSuccess] = useState(false);

const handleSendTemplateMessage = async () => {
  if (!selectedRows || selectedRows.length === 0) {
    return;
  }

  const selectedId = String(selectedRows[0]);

  const lead = leads.find(
    (item) => String(item._id) === selectedId
  );

  if (!lead) {
    return;
  }

  const firstName =
    lead.name ||
    lead.fullName ||
    lead.full_name ||
    "firstname";

  const phone =
    lead.phone ||
    lead.phone_number ||
    lead.mobileNumber ||
    lead.mobile ||
    lead.customer_no_with_prefix;

  if (!phone) {
    return;
  }

  // Reset success state
  setSendSuccess(false);

  // Start loading
  setSendingFranchiseMsg(true);

  try {
    const response = await fetch(
      "/api/admin/contact-leads/send-enquiry-template",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          firstName,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      // Loading stop
      setSendingFranchiseMsg(false);

      // Preview modal close
      setIsWhatsappTemplateModalOpen(false);

      // Success modal open
      setSendSuccess(true);

      return;
    }

    // API failed
    setSendingFranchiseMsg(false);
    alert(data.message || "Failed to send message");
  } catch (error) {
    console.error("WhatsApp send error:", error);

    // Error me bhi loading stop
    setSendingFranchiseMsg(false);

    alert("Failed to send WhatsApp template");
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
  onClick={() => setIsWhatsappTemplateModalOpen(true)}
  className="bg-white text-green-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2"
>
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

        {/* WhatsApp Modal */}
        
        {/* WhatsApp Template Modal */}
  {isWhatsappTemplateModalOpen && (
    <div className="fixed inset-0 z-50 bg-black/70 p-4">
      <div className="h-full flex items-center justify-center">
        <div className="w-full max-w-[420px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-[#f3efea] p-4">
            {/* Message Preview Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              
              <button
  type="button"
  onClick={() => setIsWhatsappTemplateModalOpen(false)}
  className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
>
  <X className="w-5 h-5 text-gray-600" />
</button>
              
              {/* Message Content */}
              <div className="p-5 text-[14px] text-gray-700 leading-8">

                <p className="mb-6 font-medium">
                  Hi {"{{1}}"},
                </p>

                <p className="mb-6">
                  Your enquiry details have been received successfully.
                </p>

                <p className="mb-6">
                  This includes your submitted business contact information and
                  related request details.
                </p>

                <p className="mb-6">
                  To continue the conversation and access further assistance, chat
                  with the Limbu AI Assistant.
                </p>

                {/* Time */}
                <div className="text-[12px] text-gray-400 text-right">
                  12:00 PM ✓✓
                </div>
              </div>

              {/* Chat Now Button */}
              <button
                type="button"
                className="w-full py-4 text-xl font-semibold text-teal-600 border-t border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chat Now
              </button>

              {/* Need Support Button */}
              <button
                type="button"
                className="w-full py-4 text-xl font-semibold text-teal-600 border-t border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Need Support
              </button>
            </div>
          </div>

          {/* Footer with Send Message Button */}
          <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
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

       


{sendSuccess && (
  <div className="fixed inset-0 z-[60] bg-black/70 p-4">
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <Send className="w-8 h-8 text-green-600" />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Template Sent Successfully
          </h3>

          <p className="text-gray-600 mb-6">
            WhatsApp template has been sent successfully.
          </p>

          <button
            type="button"
            onClick={() => setSendSuccess(false)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      </>
    );
  }