/**
 * Franchise-specific email templates for /admin/franchise/franchise-lead.
 *
 * Same contract as limbuEmailTemplates: the client posts only a templateId and
 * the send route resolves the html here, so no markup travels from the browser.
 */

import { APP_URL, wrapper } from "@/lib/limbuEmailTemplates";

export const FRANCHISE_EMAIL_TEMPLATE_GROUPS = [
  {
    id: "franchise_enquiry",
    title: "Enquiry & Follow-up",
    subtitle: "Respond to new franchise enquiries and chase replies",
    icon: "handshake",
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "franchise_investment",
    title: "Investment & Business Model",
    subtitle: "Costs, ROI and how the partnership works",
    icon: "creditCard",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "franchise_offers",
    title: "Offers & Discounts",
    subtitle: "Limited-time franchise fee offers",
    icon: "gift",
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    id: "franchise_meeting",
    title: "Meetings & Demos",
    subtitle: "Discovery call, demo and office visit invites",
    icon: "trending",
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    id: "franchise_onboarding",
    title: "Onboarding & Agreement",
    subtitle: "Documents, agreement and welcome mails",
    icon: "sparkles",
    border: "border-purple-200",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "custom",
    title: "Custom Email",
    subtitle: "Write your own subject and message",
    icon: "pencil",
    border: "border-rose-200",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
];

const FRANCHISE_URL = `${APP_URL}/franchise`;

export const FRANCHISE_EMAIL_TEMPLATES = [
  /* ----------------------------- enquiry ----------------------------- */
  {
    id: "franchise_enquiry_received",
    groupId: "franchise_enquiry",
    title: "Enquiry Received",
    subtitle: "First reply after a franchise enquiry lands",
    campaignName: "Franchise Enquiry Received",
    subject: "Thanks for your interest in the Limbu AI franchise",
    html: wrapper({
      accent: "#2563eb",
      badge: "Franchise enquiry",
      heading: "Thanks for your franchise enquiry",
      intro:
        "We have received your interest in becoming a Limbu AI franchise partner. Our franchise team will call you shortly to understand your city, budget and experience.",
      bullets: [
        "🏢 Exclusive territory rights in your city",
        "🏢 Ready product — Google Business growth for local businesses",
        "🏢 Full training, sales material and marketing support",
        "🏢 Recurring revenue from every client you onboard",
      ],
      ctaLabel: "See franchise details",
      ctaUrl: FRANCHISE_URL,
      outro:
        "If you would like a call at a specific time, just reply to this email with your preferred slot.",
    }),
  },
  {
    id: "franchise_followup",
    groupId: "franchise_enquiry",
    title: "Follow-up — No Response",
    subtitle: "Nudge leads who have not replied yet",
    campaignName: "Franchise Follow-up",
    subject: "Still interested in the Limbu AI franchise?",
    html: wrapper({
      accent: "#0891b2",
      badge: "Follow-up",
      heading: "We tried reaching you",
      intro:
        "Our team tried to connect with you about the Limbu AI franchise opportunity but could not reach you. Territories are allotted on a first-come basis, so we did not want you to miss out.",
      bullets: [
        "📍 One partner per territory — limited slots",
        "📍 Complete business setup done for you",
        "📍 Break-even typically within the first few months",
      ],
      ctaLabel: "Book a callback",
      ctaUrl: `${APP_URL}/contact`,
      outro: "Reply with a convenient time and we will call you then.",
    }),
  },
  {
    id: "franchise_brochure",
    groupId: "franchise_enquiry",
    title: "Franchise Brochure",
    subtitle: "Share the detailed franchise proposal",
    campaignName: "Franchise Brochure",
    subject: "Your Limbu AI franchise details inside",
    html: wrapper({
      accent: "#4f46e5",
      badge: "Franchise kit",
      heading: "Everything about the Limbu AI franchise",
      intro:
        "As promised, here is a summary of the Limbu AI franchise opportunity — what you get, what it costs and how you earn.",
      bullets: [
        "📄 Product suite: GMB growth, reviews, websites, automation",
        "📄 Exclusive city or district rights",
        "📄 Training, demo scripts and lead support",
        "📄 Transparent revenue-share model",
      ],
      ctaLabel: "View full details",
      ctaUrl: FRANCHISE_URL,
    }),
  },

  /* ---------------------------- investment ---------------------------- */
  {
    id: "franchise_investment_plan",
    groupId: "franchise_investment",
    title: "Investment & Returns",
    subtitle: "Explain the cost and earning model",
    campaignName: "Franchise Investment",
    subject: "Limbu AI franchise: investment and returns explained",
    html: wrapper({
      accent: "#059669",
      badge: "Investment",
      heading: "What it takes, and what you earn",
      intro:
        "Here is a clear picture of the Limbu AI franchise model so you can decide with full information.",
      bullets: [
        "💰 One-time franchise fee with exclusive territory rights",
        "💰 No heavy infrastructure — run it lean from a small office",
        "💰 Recurring income from every business you onboard",
        "💰 Additional revenue from upgrades and renewals",
      ],
      ctaLabel: "Discuss the numbers",
      ctaUrl: `${APP_URL}/contact`,
      outro:
        "Our team can walk you through a city-wise projection on a short call.",
    }),
  },
  {
    id: "franchise_support_model",
    groupId: "franchise_investment",
    title: "Support You Get",
    subtitle: "What Limbu AI provides to every partner",
    campaignName: "Franchise Support",
    subject: "You are never on your own as a Limbu AI partner",
    html: wrapper({
      accent: "#0d9488",
      badge: "Partner support",
      heading: "The support behind every franchise",
      intro:
        "Running a Limbu AI franchise does not mean figuring things out alone. Here is what our team handles with you.",
      bullets: [
        "🤝 Complete product and sales training",
        "🤝 Marketing creatives and campaign support",
        "🤝 Technical and onboarding help for your clients",
        "🤝 A dedicated relationship manager",
      ],
      ctaLabel: "Talk to our team",
      ctaUrl: `${APP_URL}/contact`,
    }),
  },

  /* ------------------------------ offers ------------------------------ */
  {
    id: "franchise_offer_discount",
    groupId: "franchise_offers",
    title: "Limited-Time Fee Offer",
    subtitle: "Discounted franchise fee campaign",
    campaignName: "Franchise Offer",
    subject: "Limited time: special offer on the Limbu AI franchise fee",
    html: wrapper({
      accent: "#ea580c",
      badge: "Limited time",
      heading: "A special offer on your franchise fee",
      intro:
        "For a limited period we are offering a reduced franchise fee for new partners. Same territory rights, same support — lower entry cost.",
      bullets: [
        "🎁 Discounted one-time franchise fee",
        "🎁 Free onboarding and training included",
        "🎁 Priority allotment of your preferred city",
      ],
      ctaLabel: "Claim this offer",
      ctaUrl: `${APP_URL}/contact`,
      outro: "Offer valid only while the current campaign is running.",
    }),
  },
  {
    id: "franchise_last_slots",
    groupId: "franchise_offers",
    title: "Last Few Territories",
    subtitle: "Urgency mail for high-demand cities",
    campaignName: "Franchise Last Slots",
    subject: "Only a few franchise territories left in your state",
    html: wrapper({
      accent: "#dc2626",
      badge: "Closing soon",
      heading: "Your city may not stay available",
      intro:
        "We allot only one Limbu AI partner per territory, and several cities in your state are already taken. If you were considering it, now is the time to confirm.",
      bullets: [
        "⏳ One partner per territory — no internal competition",
        "⏳ Cities allotted on a first-confirmed basis",
        "⏳ Confirm now to hold your preferred location",
      ],
      ctaLabel: "Reserve my territory",
      ctaUrl: `${APP_URL}/contact`,
    }),
  },

  /* ------------------------------ meeting ----------------------------- */
  {
    id: "franchise_demo_invite",
    groupId: "franchise_meeting",
    title: "Demo Invitation",
    subtitle: "Invite the lead to a live product demo",
    campaignName: "Franchise Demo Invite",
    subject: "See the Limbu AI franchise business live",
    html: wrapper({
      accent: "#4338ca",
      badge: "Live demo",
      heading: "Watch the business in action",
      intro:
        "Before you decide, join a short live session where we show you the exact product you will be selling and how partners run it day to day.",
      bullets: [
        "🎥 Full walkthrough of the Limbu AI platform",
        "🎥 How partners acquire and retain local businesses",
        "🎥 Live Q&A with our franchise team",
      ],
      ctaLabel: "Book my demo slot",
      ctaUrl: `${APP_URL}/contact`,
    }),
  },
  {
    id: "franchise_meeting_confirm",
    groupId: "franchise_meeting",
    title: "Meeting Confirmation",
    subtitle: "Confirm a scheduled call or office visit",
    campaignName: "Franchise Meeting Confirmation",
    subject: "Your Limbu AI franchise meeting is confirmed",
    html: wrapper({
      accent: "#2563eb",
      badge: "Meeting confirmed",
      heading: "Your meeting is confirmed",
      intro:
        "Thank you for scheduling time with our franchise team. Our representative will connect with you as discussed.",
      bullets: [
        "📌 Keep your city preference and budget range handy",
        "📌 Note down any questions on the model or support",
        "📌 The session usually takes 20 to 30 minutes",
      ],
      ctaLabel: "View franchise details",
      ctaUrl: FRANCHISE_URL,
      outro: "Need to reschedule? Just reply to this email.",
    }),
  },

  /* ---------------------------- onboarding ---------------------------- */
  {
    id: "franchise_documents",
    groupId: "franchise_onboarding",
    title: "Documents Required",
    subtitle: "Ask for the paperwork needed to proceed",
    campaignName: "Franchise Documents",
    subject: "Documents needed to confirm your franchise",
    html: wrapper({
      accent: "#7c3aed",
      badge: "Next step",
      heading: "A few documents and you are set",
      intro:
        "To move ahead with your Limbu AI franchise, please keep the following ready. Our team will guide you through each step.",
      bullets: [
        "🗂️ PAN and Aadhaar of the applicant",
        "🗂️ GST certificate, if you have one",
        "🗂️ Business address proof for your territory",
        "🗂️ Bank details for the revenue-share setup",
      ],
      ctaLabel: "Talk to onboarding team",
      ctaUrl: `${APP_URL}/contact`,
    }),
  },
  {
    id: "franchise_welcome",
    groupId: "franchise_onboarding",
    title: "Welcome Partner",
    subtitle: "Send after the franchise is confirmed",
    campaignName: "Franchise Welcome",
    subject: "Welcome to the Limbu AI partner family 🎉",
    html: wrapper({
      accent: "#059669",
      badge: "Welcome partner",
      heading: "Welcome aboard, partner",
      intro:
        "Your Limbu AI franchise is confirmed. Your territory is now reserved for you and onboarding starts right away.",
      bullets: [
        "✅ Partner dashboard access",
        "✅ Product and sales training schedule",
        "✅ Marketing kit and demo material",
        "✅ Your dedicated relationship manager",
      ],
      ctaLabel: "Open partner panel",
      ctaUrl: `${APP_URL}/franchise-panel/dashboard`,
      outro: "We are glad to have you with us. Let's grow together.",
    }),
  },
];

export const getFranchiseEmailTemplatesForGroup = (groupId) =>
  FRANCHISE_EMAIL_TEMPLATES.filter((t) => t.groupId === groupId);

export const getFranchiseEmailTemplateById = (id) =>
  FRANCHISE_EMAIL_TEMPLATES.find((t) => t.id === id) || null;
