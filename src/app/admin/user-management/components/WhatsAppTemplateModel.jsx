import { useState } from "react";
import {
  ArrowLeft,
  Check,
  HeartPulse,
  Loader2,
  MessageCircle,
  QrCode,
  Send,
  X,
  Globe,
  Search,
  BarChart2,
  Zap,
  MessageSquare,
  Video,
  BellRing,
  Presentation,
} from "lucide-react";

const TEMPLATE_GROUPS = [
  {
    id: "google_business",
    title: "Google Business",
    subtitle: "Send Google Business Profile templates",
    icon: Globe,
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    id: "magic_qr",
    title: "Magic QR",
    subtitle: "Send Magic Review QR onboarding templates",
    icon: QrCode,
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "gmb_health",
    title: "GMB Health",
    subtitle: "Google Business health update templates",
    icon: HeartPulse,
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "free_website",
    title: "Free Website Builder",
    subtitle: "Send Free Business Website onboarding templates",
    icon: Globe,
    border: "border-purple-200",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "keyword_plan",
    title: "Keyword Insights",
    subtitle: "Send Keyword Insights and performance templates",
    icon: Search,
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    id: "gmb_insights",
    title: "GMB Insights",
    subtitle: "Send GMB performance and visibility insights",
    icon: BarChart2,
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    id: "review_reply",
    title: "Review Reply Automation",
    subtitle: "Send GMB review reply automation details",
    icon: Zap,
    border: "border-rose-200",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    id: "webinar",
    title: "Webinar Invite",
    subtitle: "Send webinar invite with date, time & join link",
    icon: Video,
    border: "border-teal-200",
    bg: "bg-teal-50",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    id: "subscription_reminder",
    title: "Subscription Reminder (Hindi)",
    subtitle: "Hindi me subscription renewal reminder bhejein",
    icon: BellRing,
    border: "border-orange-200",
    bg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: "business_workshop",
    title: "Business Growth Workshop",
    subtitle: "Workshop invite video ke saath bhejein",
    icon: Presentation,
    border: "border-violet-200",
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    id: "bulk_whatsapp",
    title: "Bulk WhatsApp",
    subtitle: "Send bulk scheduled WhatsApp messages",
    icon: MessageSquare,
    border: "border-green-200",
    bg: "bg-green-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
];

const GOOGLE_BUSINESS_TEMPLATES = [
  {
    id: "google_business_profile_management",
    title: "Google Business Profile Management",
    subtitle: "Connect with your dedicated support manager",
    preview: [
      "Hi 👋 {{1}}",
      "Thank you for choosing our Google Business Profile management service.",
      "✨ Priya has been assigned as your dedicated support manager.",
      "Click the “Chat Now” button below to connect with Priya and start using your free features:",
      "✅ GMB Insights",
      "✅ Magic QR",
      "✅ GMB Health Check",
      "✅ Free Business Website",
      "✅ Auto Reply Setup",
      "👇 Tap below to start chatting with Priya.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const MAGIC_QR_TEMPLATES = [
  {
    id: "magic_qr_code",
    title: "Magic QR Created",
    subtitle: "Send after the Smart Magic Review QR is generated",
    preview: [
      "Hi {{1}},",
      "Your Smart Magic Review QR has been successfully created for your business.",
      "This QR helps you collect more positive Google reviews from your customers through a seamless review experience.",
      "To access your QR and explore more GMB growth tools, chat now with the Limbu AI Assistant.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const GMB_HEALTH_TEMPLATES = [
  {
    id: "gmb_health",
    title: "GMB Health Report",
    subtitle: "Send after the GMB Health Report is generated",
    preview: [
      "Hi {{1}},",
      "Your GMB Health Report has been successfully generated for your business.",
      "This report provides insights into your Google Business performance, customer engagement, visibility, reviews, and ranking opportunities.",
      "To access your report and explore more GMB growth tools, chat now with the Limbu AI Assistant.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const FREE_WEBSITE_TEMPLATES = [
  {
    id: "free_website_build",
    title: "Free Website Ready",
    subtitle: "Send after the Free Business Website is generated",
    preview: [
      "Hi {{1}},",
      "Your Free Business Website is now ready.",
      "It helps your business get more online visibility and attract more customers.",
      "To access your website and explore more growth tools, chat now with the Limbu AI Assistant.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const KEYWORD_PLAN_TEMPLATES = [
  {
    id: "keyword_insights",
    title: "Keyword Insights",
    subtitle: "Send Business Keyword Insights template",
    preview: [
      "Hi {{1}},",
      "Your business keyword insights are available.",
      "This includes search keywords, visibility insights, and Google Business performance data related to your business profile.",
      "To access your keyword insights and business tools, chat with the Limbu AI Assistant.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const GMB_INSIGHTS_TEMPLATES = [
  {
    id: "gmb_insights",
    title: "GMB Insights",
    subtitle: "Send GMB performance and visibility insights",
    preview: [
      "Hi {{1}},",
      "Get detailed GMB insights for your business, including customer engagement, search visibility, Google Maps performance, and ranking trends.",
      "Understand how customers discover and interact with your business on Google.",
      "To access your GMB insights and explore more growth tools, chat now with the Limbu AI Assistant.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const REVIEW_REPLY_TEMPLATES = [
  {
    id: "review_reply_automation_new",
    title: "Review Reply Automation",
    subtitle: "Send GMB review reply automation details",
    preview: [
      "Hi {{1}},",
      "Your GMB review reply automation details are available.",
      "This includes automated response settings and review engagement activity related to your Google Business Profile.",
      "To access your automation details and related business tools, chat with the Limbu AI Assistant.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const WEBINAR_TEMPLATES = [
  {
    id: "webinar_invite",
    title: "Webinar Invite",
    subtitle: "Date & time choose karke selected leads ko invite bhejein",
    preview: [
      "Hi {{1}},",
      "You are invited to our Limbu AI business growth webinar.",
      "🗓️ Date & Time: {{2}}",
      "🔗 Join Link: {{3}}",
      "🆔 Webinar ID: 864 3594 1427",
      "🔐 Passcode: 800770",
      "See you there!",
    ],
    buttons: ["Join Webinar"],
  },
];

const SUBSCRIPTION_REMINDER_TEMPLATES = [
  {
    id: "subscription_reminder_hindi",
    title: "Subscription Reminder (Hindi)",
    subtitle: "Ek hi request me saare selected users ko jaata hai",
    preview: [
      "नमस्ते {{1}},",
      "Limbu AI के फ्री वेबिनार में आपका स्वागत है।",
      "अपनी सीट रजिस्टर करने के लिए नीचे दिए लिंक पर क्लिक करें:",
      "🔗 {{2}}",
      "किसी भी सहायता के लिए नीचे चैट करें।",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const BUSINESS_WORKSHOP_TEMPLATES = [
  {
    id: "business_growth_workshop",
    title: "Business Growth Workshop",
    subtitle: "Video header ke saath, ek hi request me saare users ko",
    // Link ab {{1}} VARIABLE hai — purane template me wo static text tha, isliye
    // bheja hua join link message me kabhi dikhta hi nahi tha.
    preview: [
      "🎥 (Video: Business Growth Workshop)",
      "🔴 LIVE Workshop — Aaj 6 PM",
      "👉 {{1}}  ← join link (server se jaata hai)",
      "🆔 Webinar ID: 864 3594 1427",
      "🔐 Passcode: 800770",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const BULK_WHATSAPP_TEMPLATES = [
  {
    id: "bulk_custom_whatsapp",
    title: "Bulk WhatsApp Campaign",
    subtitle: "Send WhatsApp message to selected leads",
    preview: [
      "Hi {{1}},",
      "We are reaching out regarding your business growth opportunities.",
      "Limbu AI helps businesses improve Google visibility, reviews, and customer engagement.",
      "Chat now with Limbu AI to explore powerful business growth tools.",
    ],
    buttons: ["Chat Now", "Need Support"],
  },
];

const getTemplatesForGroup = (groupId) => {
  if (groupId === "google_business") return GOOGLE_BUSINESS_TEMPLATES;
  if (groupId === "magic_qr") return MAGIC_QR_TEMPLATES;
  if (groupId === "gmb_health") return GMB_HEALTH_TEMPLATES;
  if (groupId === "free_website") return FREE_WEBSITE_TEMPLATES;
  if (groupId === "keyword_plan") return KEYWORD_PLAN_TEMPLATES;
  if (groupId === "gmb_insights") return GMB_INSIGHTS_TEMPLATES;
  if (groupId === "review_reply") return REVIEW_REPLY_TEMPLATES;
  if (groupId === "webinar") return WEBINAR_TEMPLATES;
  if (groupId === "subscription_reminder")
    return SUBSCRIPTION_REMINDER_TEMPLATES;
  if (groupId === "business_workshop") return BUSINESS_WORKSHOP_TEMPLATES;
  if (groupId === "bulk_whatsapp") return BULK_WHATSAPP_TEMPLATES;

  return [];
};

export default function WhatsappModal({
  isOpen,
  setIsOpen,
  selectedCount = 0,
  onSendTemplate,
  sendingTemplateId = "",
  bulkWaSendDate,
  setBulkWaSendDate,
  onBulkSend,
  bulkWaSending,
}) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  // Webinar template har baar naye date & time ke saath jaata hai.
  const [webinarDateTime, setWebinarDateTime] = useState("");

  if (!isOpen) return null;

  const selectedGroupMeta = TEMPLATE_GROUPS.find((g) => g.id === selectedGroup);
  const templates = getTemplatesForGroup(selectedGroup);

  const closeModal = () => {
    if (sendingTemplateId) return;
    setSelectedGroup(null);
    setWebinarDateTime("");
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-scaleIn">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedGroup && (
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                disabled={!!sendingTemplateId}
                className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition disabled:opacity-50"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <MessageCircle size={28} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedGroupMeta?.title || "WhatsApp Templates"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedCount} selected user{selectedCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={!!sendingTemplateId}
            className="h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {!selectedGroup ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATE_GROUPS.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedGroup(template.id)}
                className={`w-full rounded-2xl border ${template.border} ${template.bg} px-6 py-6 flex items-center justify-between hover:shadow-lg transition-all duration-300`}
              >
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-800">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.subtitle}
                  </p>
                </div>
                <div
                  className={`h-14 w-14 rounded-2xl ${template.iconBg} flex items-center justify-center`}
                >
                  <template.icon size={24} className={template.iconColor} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 max-h-[75vh] overflow-y-auto">
            {templates.map((template) => {
              const isSending =
                sendingTemplateId === template.id ||
                (selectedGroup === "bulk_whatsapp" && bulkWaSending);
              return (
                <div
                  key={template.id}
                  className="rounded-2xl border border-gray-200 bg-slate-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-base font-bold text-gray-900">
                      {template.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {template.subtitle}
                    </p>
                  </div>

                  <div className="p-4 bg-[#e9ded5]">
                    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className="p-4 space-y-4 text-sm leading-6 text-slate-900">
                        {template.preview.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                          12:00 PM <Check size={12} />
                        </div>
                      </div>
                      {template.buttons.map((button) => (
                        <div
                          key={button}
                          className="border-t border-gray-100 py-3 text-center text-sm font-medium text-blue-600"
                        >
                          {button}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    {selectedGroup === "bulk_whatsapp" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Schedule Date & Time
                        </label>

                        <input
                          type="datetime-local"
                          value={bulkWaSendDate}
                          onChange={(e) => setBulkWaSendDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {selectedGroup === "webinar" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Webinar Date &amp; Time{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="datetime-local"
                          value={webinarDateTime}
                          onChange={(e) => setWebinarDateTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />

                        <p className="mt-2 text-xs text-gray-500">
                          Ye date &amp; time message ke {"{{2}}"} me jayega.
                          Join link automatic lagta hai.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={
                        template.disabled ||
                        !!sendingTemplateId ||
                        (selectedGroup === "webinar" && !webinarDateTime)
                      }
                      onClick={() => {
                        if (selectedGroup === "bulk_whatsapp") {
                          onBulkSend?.();
                        } else if (selectedGroup === "webinar") {
                          if (!webinarDateTime) return;
                          onSendTemplate?.(template, { webinarDateTime });
                        } else {
                          onSendTemplate?.(template);
                        }
                      }}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
