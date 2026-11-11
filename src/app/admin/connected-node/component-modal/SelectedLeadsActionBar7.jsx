// components/SelectedLeadsActionBar.jsx

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] =
    useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render if nothing selected
  if (selectedRows.length === 0) return null;

  const templates = [
    {
      title: "Template 1",
      subtitle: "Welcome onboarding template",
      border: "border-indigo-200",
      bg: "bg-indigo-50",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "Template 2",
      subtitle: "Payment follow-up template",
      border: "border-blue-200",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Template 3",
      subtitle: "Expiry reminder template",
      border: "border-purple-200",
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

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
          <button
            onClick={() =>
              setIsWhatsappModalOpen(true)
            }
            className="bg-white text-green-600 px-6 py-3 rounded-2xl font-semibold shadow-sm flex items-center gap-2 hover:shadow-lg transition"
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
      {mounted &&
        isWhatsappModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl bg-white rounded-[28px] shadow-2xl overflow-hidden animate-scaleIn">
              {/* Header */}
              <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <MessageCircle
                      size={28}
                      className="text-indigo-600"
                    />
                  </div>

                  <div>
                    <h2 className="text-4xl font-bold text-gray-800">
                      WhatsApp Templates
                    </h2>
                    <p className="text-gray-500 mt-1">
                      Select template for selected users
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setIsWhatsappModalOpen(false)
                  }
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                >
                  <X
                    size={22}
                    className="text-gray-500"
                  />
                </button>
              </div>

              {/* Template List */}
              <div className="p-8 space-y-5">
                {templates.map(
                  (template, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        console.log(
                          "Selected Template:",
                          template.title
                        );
                        setIsWhatsappModalOpen(
                          false
                        );
                      }}
                      className={`w-full border ${template.border} ${template.bg}
                      rounded-3xl p-6 flex items-center justify-between
                      hover:shadow-lg hover:scale-[1.01]
                      transition-all duration-300 text-left`}
                    >
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {template.title}
                        </h3>
                        <p className="text-gray-500 mt-2 text-lg">
                          {template.subtitle}
                        </p>
                      </div>

                      <div
                        className={`w-14 h-14 rounded-2xl ${template.iconBg}
                        flex items-center justify-center`}
                      >
                        <MessageCircle
                          size={24}
                          className={
                            template.iconColor
                          }
                        />
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}