

"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsappTemplateModal({
  showWhatsappModal,
  setShowWhatsappModal,
}) {
  if (!showWhatsappModal) return null;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      
      {/* MODAL */}
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <MessageCircle
                size={30}
                className="text-indigo-600"
              />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                WhatsApp Templates
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Select template for selected users
              </p>
            </div>
          </div>

          {/* CLOSE */}
          <button
            onClick={() => setShowWhatsappModal(false)}
            className="h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-5">
          
          {templates.map((template, index) => (
            <button
              key={index}
              className={`w-full rounded-3xl border ${template.border}
              ${template.bg}
              px-6 py-6 flex items-center justify-between
              hover:shadow-lg transition-all duration-300`}
            >
              
              {/* LEFT */}
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">
                  {template.title}
                </h3>

                <p className="text-base text-gray-500 mt-1">
                  {template.subtitle}
                </p>
              </div>

              {/* RIGHT ICON */}
              <div
                className={`h-14 w-14 rounded-2xl ${template.iconBg}
                flex items-center justify-center`}
              >
                <MessageCircle
                  size={24}
                  className={template.iconColor}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}