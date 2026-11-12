// Home sections that exist only on the website (not in the app's home_sections
// collection), and the order sections appear in on the website.
import { whatsappHref } from "@/lib/seoTools";

/** Website section order; sections not listed keep their DB order after these. */
export const WEB_SECTION_ORDER = [
  "gbp",
  "social_media",
  "ai_tools",
  "outreach",
  "website_seo",
  "paid_ads",
  "website_development",
  "custom_crm",
  "mobile_app",
];

const enquiry = (text) => ({ type: "url", value: whatsappHref(text) });

const tile = (key, label, description, icon, ask) => ({
  key,
  label,
  description,
  icon,
  badge: null,
  coinCost: 0,
  comingSoon: false,
  access: { status: "open" },
  action: enquiry(ask),
});

export const WEB_ONLY_SECTIONS = [
  {
    key: "custom_crm",
    title: "Custom CRM",
    icon: { type: "material", value: "contacts" },
    viewAll: null,
    items: [
      tile("crm_leads", "Lead Management", "Capture leads from Google, Meta, website and WhatsApp in one place", { type: "material", value: "contacts" }, "Hi Limbu AI, I want a custom CRM with lead management."),
      tile("crm_pipeline", "Sales Pipeline", "Track every deal from enquiry to payment on a simple board", { type: "material", value: "view_kanban" }, "Hi Limbu AI, I want a custom CRM with a sales pipeline."),
      tile("crm_followups", "WhatsApp & Email Follow-ups", "Automatic reminders so no lead goes cold", { type: "brand", value: "whatsapp" }, "Hi Limbu AI, I want a CRM with WhatsApp and email follow-ups."),
      tile("crm_team", "Team & Roles", "Assign leads to your team with the right access for each role", { type: "material", value: "groups" }, "Hi Limbu AI, I want a CRM for my sales team."),
      tile("crm_reports", "Reports & Dashboards", "Leads, conversions and revenue at a glance", { type: "material", value: "pie_chart" }, "Hi Limbu AI, I want a CRM with reports and dashboards."),
      tile("crm_workflows", "Custom Workflows", "Automations built around how your business works", { type: "material", value: "workflow" }, "Hi Limbu AI, I want a CRM with custom workflows."),
    ],
  },
  {
    key: "mobile_app",
    title: "Custom App Development",
    icon: { type: "material", value: "smartphone" },
    viewAll: null,
    items: [
      tile("app_android", "Android App", "A fast native-feel app on the Google Play Store", { type: "brand", value: "android" }, "Hi Limbu AI, I want an Android app for my business."),
      tile("app_ios", "iOS App", "An iPhone app published on the Apple App Store", { type: "brand", value: "apple" }, "Hi Limbu AI, I want an iOS app for my business."),
      tile("app_cross", "Cross-platform App", "One app for Android and iPhone with Flutter or React Native", { type: "material", value: "layers" }, "Hi Limbu AI, I want a cross-platform mobile app."),
      tile("app_admin", "Admin Panel", "Manage products, orders and users from a web dashboard", { type: "material", value: "dashboard" }, "Hi Limbu AI, I want a mobile app with an admin panel."),
      tile("app_push", "Push Notifications", "Send offers and updates straight to your customers' phones", { type: "material", value: "notifications" }, "Hi Limbu AI, I want a mobile app with push notifications."),
      tile("app_publish", "App Store Publishing", "We handle Play Store and App Store listing and approval", { type: "material", value: "rocket" }, "Hi Limbu AI, I want help publishing my app on the stores."),
    ],
  },
];

// Website names for app sections (the app keeps its own titles).
const WEB_TITLES = { ai_tools: "Create Video" };

/** Appends the website-only sections, renames per WEB_TITLES and sorts by WEB_SECTION_ORDER. */
export function withWebSections(sections) {
  const all = [...sections, ...WEB_ONLY_SECTIONS.filter((w) => !sections.some((s) => s.key === w.key))].map((s) =>
    WEB_TITLES[s.key] ? { ...s, title: WEB_TITLES[s.key] } : s
  );
  const rank = (key) => {
    const i = WEB_SECTION_ORDER.indexOf(key);
    return i === -1 ? WEB_SECTION_ORDER.length : i;
  };
  return all
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s.key) - rank(b.s.key) || a.i - b.i)
    .map(({ s }) => s);
}
