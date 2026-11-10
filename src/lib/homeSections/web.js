import { unstable_cache } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import HomeSection from "@/models/HomeSection";
import { SEO_TOOLS, seoToolPath, whatsappHref } from "@/lib/seoTools";
import { GMB_TOOL_COPY } from "@/lib/gmbPlan";
import { buildUserContext } from "./access";
import { seedIfEmpty, toPublicSection } from "./server";

/**
 * Website SEO tiles on the website: only Website Audit is free, and every tile
 * opens its own detail page (/seo-tools/<slug>) instead of the pricing page.
 * The app API (/api/home-sections) is not affected.
 */
function withSeoToolPages(section) {
  if (section.key !== "website_seo") return section;
  return {
    ...section,
    items: section.items.map((item) => {
      const tool = SEO_TOOLS[item.key];
      if (!tool || item.comingSoon) return item;
      return {
        ...item,
        badge: tool.free ? "FREE" : item.badge === "FREE" ? null : item.badge,
        action: { type: "url", value: seoToolPath(tool) },
      };
    }),
  };
}

/**
 * Extra outreach channels, website only (the app does not have these screens).
 * Each tile opens a WhatsApp enquiry with our team.
 */
const OUTREACH_ADD_ONS = [
  {
    key: "sms_marketing",
    label: "SMS Marketing",
    description: "Bulk and automated SMS offers, reminders and alerts",
    icon: { type: "material", value: "chat_bubble_outline" },
    enquiry: "Hi Limbu AI, I want to start SMS marketing for my business.",
  },
  {
    key: "rcs_messaging",
    label: "RCS Messaging",
    description: "Rich branded messages with images and buttons on Android",
    icon: { type: "material", value: "forum" },
    enquiry: "Hi Limbu AI, I want to send RCS messages to my customers.",
  },
  {
    key: "voice_calls",
    label: "Voice Call Campaigns",
    description: "Pre-recorded calls and IVR to reach every customer",
    icon: { type: "material", value: "support_agent" },
    enquiry: "Hi Limbu AI, I want to run voice call campaigns for my business.",
  },
];

function withOutreachAddOns(section) {
  if (section.key !== "outreach") return section;
  const have = new Set(section.items.map((i) => i.key));
  const extra = OUTREACH_ADD_ONS.filter((a) => !have.has(a.key)).map(({ enquiry, ...a }) => ({
    ...a,
    badge: "NEW",
    coinCost: 0,
    comingSoon: false,
    access: { status: "open" },
    action: { type: "url", value: whatsappHref(enquiry) },
  }));
  return { ...section, items: [...section.items, ...extra] };
}

/**
 * Google Business Profile tiles on the website: none are free, they unlock
 * with the GMB Plan (lib/gmbPlan.js). Locked is the guest view; GmbToolGrid
 * shows them unlocked for a user whose plan includes them.
 */
function withGmbLock(section) {
  if (section.key !== "gbp") return section;
  return {
    ...section,
    items: section.items.map((item) =>
      item.comingSoon
        ? item
        : {
            ...item,
            ...GMB_TOOL_COPY[item.key],
            badge: "UNLOCK",
            access: { ...item.access, status: "locked" },
          }
    ),
  };
}

/**
 * Same sections and tiles as GET /api/home-sections (guest view), for the
 * website's home page. Cached for 5 minutes so the landing page does not hit
 * the DB on every visit; admin changes show up within that time.
 */
export const getHomeSectionsForWeb = unstable_cache(
  async () => {
    try {
      await dbConnect();
      await seedIfEmpty();
      const docs = await HomeSection.find({ isActive: true }).sort({ order: 1 }).lean();
      const ctx = buildUserContext(null);
      // Plain JSON — cached values must be serialisable.
      return JSON.parse(
        JSON.stringify(
          docs
            .map((doc) =>
              withOutreachAddOns(withGmbLock(withSeoToolPages(toPublicSection(doc, ctx))))
            )
            .filter((s) => s.items.length > 0)
        )
      );
    } catch (err) {
      // The landing page must still render if the DB is unreachable.
      console.error("getHomeSectionsForWeb error:", err);
      return [];
    }
  },
  ["home-sections-web-v7"],
  { revalidate: 300 }
);
