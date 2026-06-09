export const sourceColorClass = (source) => {
  switch (source) {
    case "website":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "chatbot":
      return "bg-green-50 text-green-700 border-green-200";

    case "manual_upload":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "facebook":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "instagram":
      return "bg-pink-50 text-pink-700 border-pink-200";

    case "whatsapp":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "google_ads":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "referral":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case "meta_leads":
      return "bg-sky-50 text-sky-700 border-sky-200";

    case "real_estate_leads":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "signup":
      return "bg-gray-50 text-gray-700 border-gray-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};