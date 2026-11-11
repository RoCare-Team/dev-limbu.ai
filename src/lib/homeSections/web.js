import { unstable_cache } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import HomeSection from "@/models/HomeSection";
import { SEO_TOOLS, seoToolPath } from "@/lib/seoTools";
import { GMB_TOOL_COPY } from "@/lib/gmbPlan";
import { OUTREACH_LIVE_TOOLS } from "@/lib/outreachPlans";
import { withWebSections } from "./webOnlySections";
import { AD_SERVICES, adServicePath } from "@/lib/adServices";
import { buildUserContext } from "./access";
import { seedIfEmpty, toPublicSection } from "./server";

/**
 * Website SEO tiles on the website: only Website Audit is free; the rest are
 * locked behind the SEO plans until bought, then open their own detail page
 * (/seo-tools/<slug>).
 * The app API (/api/home-sections) is not affected.
 */
function withSeoToolPages(section) {
  if (section.key !== "website_seo") return section;
  return {
    ...section,
    items: section.items.map((item) => {
      const tool = SEO_TOOLS[item.key];
      if (!tool || item.comingSoon) return item;
      // The free audit stays open; every paid service is locked until the user
      // has an SEO plan, so a click opens the plans modal (OfferToolGrid).
      return {
        ...item,
        badge: tool.free ? "FREE" : "UNLOCK",
        ...(!tool.free && { access: { ...item.access, status: "locked" } }),
        action: { type: "url", value: seoToolPath(tool) },
      };
    }),
  };
}

/** Paid Ads tiles on the website open their own page (/ads/<slug>) instead of /pricing. */
function withAdPages(section) {
  if (section.key !== "paid_ads") return section;
  return {
    ...section,
    items: section.items.map((item) => {
      const service = AD_SERVICES[item.key];
      if (!service || item.comingSoon) return item;
      return { ...item, action: { type: "url", value: adServicePath(service) } };
    }),
  };
}

// Tiles the app shows but the website does not.
const HIDDEN_ON_WEB = new Set(["social_plans", "all_ad_plans"]);

const withoutHiddenTiles = (section) => ({
  ...section,
  items: section.items.filter((item) => !HIDDEN_ON_WEB.has(item.key)),
});

/** Extra outreach channels, website only (the app does not have these screens yet). */
const OUTREACH_ADD_ONS = [
  {
    key: "sms_marketing",
    label: "SMS Marketing",
    description: "Bulk and automated SMS offers, reminders and alerts",
    icon: { type: "material", value: "chat_bubble_outline" },
  },
  {
    key: "rcs_messaging",
    label: "RCS Messaging",
    description: "Rich branded messages with images and buttons on Android",
    icon: { type: "material", value: "forum" },
  },
  {
    key: "voice_calls",
    label: "Voice Call Campaigns",
    description: "Pre-recorded calls and IVR to reach every customer",
    icon: { type: "material", value: "support_agent" },
  },
];

/**
 * Outreach on the website: Emailer and WhatsApp Automation are live ("NEW";
 * locked until the user has an outreach plan, so a click opens the plans
 * modal), every other channel is "Soon".
 */
function withOutreachAddOns(section) {
  if (section.key !== "outreach") return section;
  const have = new Set(section.items.map((i) => i.key));
  const soon = (item) => ({ ...item, badge: "COMING SOON", comingSoon: true, access: { status: "coming_soon" } });
  const items = section.items.map((item) =>
    OUTREACH_LIVE_TOOLS.includes(item.key)
      ? {
          ...item,
          badge: "NEW",
          comingSoon: false,
          access: { ...item.access, status: "locked" },
          ...(item.key === "whatsapp_automation" && { action: { type: "url", value: "/dashboard?tab=whatsapp" } }),
        }
      : soon(item)
  );
  const extra = OUTREACH_ADD_ONS.filter((a) => !have.has(a.key)).map((a) => soon({ ...a, coinCost: 0 }));
  return { ...section, items: [...items, ...extra] };
}

/**
 * Google Business Profile tiles on the website: none are free, they unlock
 * with the GMB Plan (lib/gmbPlan.js). Locked is the guest view; OfferToolGrid
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
          withWebSections(
            docs
              .map((doc) =>
                withoutHiddenTiles(
                  withAdPages(
                    withOutreachAddOns(withGmbLock(withSeoToolPages(toPublicSection(doc, ctx))))
                  )
                )
              )
                .filter((s) => s.items.length > 0)
          )
        )
      );
    } catch (err) {
      // The landing page must still render if the DB is unreachable.
      console.error("getHomeSectionsForWeb error:", err);
      return [];
    }
  },
  ["home-sections-web-v14"],
  { revalidate: 300 }
);
