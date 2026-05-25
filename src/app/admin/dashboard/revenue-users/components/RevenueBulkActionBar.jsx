

"use client";

import { useState } from "react";
import WhatsappTemplateModal from "./WhatsappTemplateModal";

import {
  Users,
  MessageCircle,
  Send,
  Mail,
  Smartphone,
} from "lucide-react";

export default function RevenueBulkActionBar({ selectedRows }) {

  const [showWhatsappModal, setShowWhatsappModal] = useState(false);

  const handleSendTemplate = async (templateName) => {
  try {
    const res = await fetch("/api/admin/bulk-whatsapp-template", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedRows,
        templateName,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("WhatsApp template sent successfully");
      setShowWhatsappModal(false);
    } else {
      alert(data.message || "Failed");
    }
  } catch (error) {
    console.log(error);
    alert("Something went wrong");
  }
};

  return (


    <>
  <div className="mb-6">
      {/* NORMAL HEADER */}
      <div
        className={`transition-all duration-500 overflow-hidden ${
          selectedRows.length === 0
            ? "max-h-[120px] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-indigo-600 ">
          {/* LEFT SIDE */}
          <div>
            <h3
              className="text-xl font-bold text-white tracking-tight 
              flex items-center gap-2"
            >
              Revenue Users List

              <span
                className="text-xs bg-emerald-100 text-emerald-700
                px-2 py-1 rounded-full"
              >
                Live
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      <div
        className={`overflow-hidden transition-all duration-700 ease-in-out ${
          selectedRows.length > 0
            ? "max-h-[400px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div
          className={`transform transition-all duration-700
          ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            selectedRows.length > 0
              ? "translate-y-0 scale-100"
              : "-translate-y-10 scale-95"
          }`}
        >
          <div
            className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600
             px-6 py-3 flex flex-wrap items-center
            justify-between gap-4 shadow-lg"
          >
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <div
                className="relative h-14 w-14 rounded-2xl
                bg-white/20 backdrop-blur-md
                flex items-center justify-center text-white"
              >
                <span
                  className="absolute inset-0 rounded-2xl
                  animate-ping bg-white/20"
                ></span>

                <Users
                  size={24}
                  className="relative z-10"
                />
              </div>

              <div className="text-white">
                <p className="text-sm font-medium opacity-90">
                  Selected Leads
                </p>

                <h2 className="text-3xl font-extrabold leading-none">
                  {selectedRows.length}
                </h2>
              </div>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex flex-wrap items-center gap-3">
              <button
  onClick={() => setShowWhatsappModal(true)}
  className="group bg-white px-6 py-3 rounded-2xl
  flex items-center gap-2 text-green-600 font-semibold
  shadow-md hover:shadow-xl hover:-translate-y-1
  hover:scale-105 active:scale-95
  transition-all duration-300"
>
  <MessageCircle
    size={20}
    className="group-hover:rotate-12 transition"
  />
  WhatsApp
</button>




              <button
                className="group bg-white px-6 py-3 rounded-2xl
                flex items-center gap-2 text-blue-600 font-semibold
                shadow-md hover:shadow-xl hover:-translate-y-1
                hover:scale-105 active:scale-95
                transition-all duration-300"
              >
                <Send
                  size={20}
                  className="group-hover:-rotate-12 transition"
                />
                RCS
              </button>

              <button
                className="group bg-white px-6 py-3 rounded-2xl
                flex items-center gap-2 text-purple-600 font-semibold
                shadow-md hover:shadow-xl hover:-translate-y-1
                hover:scale-105 active:scale-95
                transition-all duration-300"
              >
                <Mail
                  size={20}
                  className="group-hover:scale-110 transition"
                />
                Email
              </button>

              <button
                className="group bg-white px-6 py-3 rounded-2xl
                flex items-center gap-2 text-orange-600 font-semibold
                shadow-md hover:shadow-xl hover:-translate-y-1
                hover:scale-105 active:scale-95
                transition-all duration-300"
              >
                <Smartphone
                  size={20}
                  className="group-hover:rotate-6 transition"
                />
                SMS
              </button>
            </div>
          </div>
        </div>
      </div>


      
    </div>

    {showWhatsappModal && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl">

      <h2 className="text-2xl font-bold mb-5">
        Select WhatsApp Template
      </h2>

      <div className="space-y-3">

        {/* TEMPLATE 1 */}
        <button
          onClick={() =>
            handleSendTemplate("plan_expired_comdown")
          }
          className="w-full bg-green-600 hover:bg-green-700
          text-white py-3 rounded-xl font-semibold"
        >
          Expiry Reminder Template 
        </button>

        {/* TEMPLATE 2 */}
        <button
          onClick={() =>
            handleSendTemplate("limbu_ai_plan_expired")
          }
          className="w-full bg-red-600 hover:bg-red-700
          text-white py-3 rounded-xl font-semibold"
        >
          Plan Expired Template
        </button>

      </div>

      <button
        onClick={() => setShowWhatsappModal(false)}
        className="mt-5 w-full border py-3 rounded-xl"
      >
        Cancel
      </button>
    </div>
  </div>
)}
    </>

    
  );
}