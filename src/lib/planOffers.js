/**
 * Plan offers sold from the home page unlock modal (GMB, Social Media,
 * Outreach, Website SEO, Paid Ads and Website Development sections). Each offer has a
 * default billing `cycle` and the `cycles` the buyer can pick from; the server prices
 * orders from here too (see /api/razorpay/create-order).
 */
import { GST_RATE, SEO_PLANS, formatInr } from "@/lib/seoPlans";
import { GMB_DEMO_VIDEO_ID, GMB_PLAN, GMB_TIERS } from "@/lib/gmbPlan";
import { SOCIAL_DEMO_VIDEO_ID, SOCIAL_TIERS } from "@/lib/socialPlans";
import { OUTREACH_DEMO_VIDEO_ID, OUTREACH_TIERS } from "@/lib/outreachPlans";
import { AD_PLANS } from "@/lib/adServices";
import { WEB_DEVELOPMENT_PLANS } from "@/lib/webPlans";

// months = billing periods charged; unit / short label the headline price.
const CYCLES = {
  yearly: { months: 12, label: "Annual plan", every: "once a year", note: "All plans billed yearly", billed: "Billed yearly", unit: "/ month", short: "/mo" },
  quarterly: { months: 3, label: "Quarterly plan", every: "every 3 months", note: "All plans billed quarterly", billed: "Billed quarterly", unit: "/ month", short: "/mo" },
  monthly: { months: 1, label: "Monthly plan", every: "every month", note: "All plans billed monthly", billed: "Billed monthly", unit: "/ month", short: "/mo" },
  "one-time": { months: 1, label: "One-time fee", every: "once", note: "One-time fee", billed: "One-time fee", unit: "one-time", short: "" },
};

// Ad account setups from the pricing page, sold as a one-time fee.
const ADS_TIERS = AD_PLANS.map((p) => ({
  key: p.title.toLowerCase().replace(/\s+/g, "-"),
  title: p.title,
  tagline: p.description,
  perMonth: p.basePrice, // the whole one-time fee (one period)
  listPerMonth: null,
  popular: !!p.popular,
  features: p.staticFeatures,
}));

// Website packages from the pricing page, a one-time project fee.
const WEB_TIERS = WEB_DEVELOPMENT_PLANS.map((p) => ({
  key: p.title.toLowerCase().replace(/\s+/g, "-"),
  title: p.title,
  tagline: p.description,
  perMonth: p.basePrice, // the whole one-time fee (one period)
  listPerMonth: null,
  popular: !!p.popular,
  features: [`Up to ${p.basePages} pages`, ...p.staticFeatures],
}));

// Same packages as the pricing page; SEO is sold monthly at its list price, or
// yearly at 20% off (the monthly price shown struck through).
const SEO_TIERS = SEO_PLANS.map((p) => ({
  key: p.title.toLowerCase().replace(/\s+/g, "-"),
  title: p.title,
  tagline: p.description,
  perMonth: p.basePrice,
  listPerMonth: null,
  popular: !!p.popular,
  features: p.staticFeatures,
  byCycle: { yearly: { perMonth: Math.round(p.basePrice * 0.8), listPerMonth: p.basePrice } },
  addon: "Free website audit included",
}));

export const PLAN_OFFERS = {
  gmb: {
    key: "gmb",
    planGroup: "gmb", // lib/userPlans.js PLAN_GROUPS
    cycle: "yearly", // opens on Yearly; Quarterly is the other option
    cycles: ["quarterly", "yearly"],
    heading: "Unlock all GMB tools",
    toolsLabel: "GMB tools",
    homeHref: "/dashboard",
    demoVideoId: GMB_DEMO_VIDEO_ID,
    tiers: GMB_TIERS,
  },
  social: {
    key: "social",
    planGroup: "social",
    cycle: "yearly", // opens on Yearly; Quarterly is the other option
    cycles: ["quarterly", "yearly"],
    heading: "Grow your social media",
    toolsLabel: "Social media tools",
    homeHref: "/social-media",
    demoVideoId: SOCIAL_DEMO_VIDEO_ID,
    tiers: SOCIAL_TIERS,
  },
  outreach: {
    key: "outreach",
    planGroup: "outreach",
    cycle: "yearly", // opens on Yearly; Quarterly is the other option
    cycles: ["quarterly", "yearly"],
    heading: "Reach & engage customers",
    toolsLabel: "Outreach tools",
    homeHref: "/dashboard?tab=whatsapp",
    demoVideoId: OUTREACH_DEMO_VIDEO_ID,
    tiers: OUTREACH_TIERS,
  },
  seo: {
    key: "seo",
    planGroup: "seo",
    cycle: "yearly", // opens on Yearly; Monthly is the other option
    cycles: ["monthly", "yearly"],
    heading: "Rank higher on Google",
    toolsLabel: "SEO services",
    homeHref: "/seo-tools/website-audit",
    demoVideoId: GMB_DEMO_VIDEO_ID,
    tiers: SEO_TIERS,
  },
  ads: {
    key: "ads",
    planGroup: "ads",
    cycle: "one-time",
    note: "One-time setup fee · ad spend paid to the platform",
    payVerb: "Book Setup",
    heading: "Get more leads from ads",
    toolsLabel: "Ad accounts",
    homeHref: "/dashboard",
    demoVideoId: GMB_DEMO_VIDEO_ID,
    tiers: ADS_TIERS,
  },
  web: {
    key: "web",
    planGroup: "web",
    cycle: "one-time",
    note: "One-time project fee",
    payVerb: "Start Project",
    heading: "Get a website that sells",
    toolsLabel: "Website project",
    homeHref: "/website-development",
    demoVideoId: GMB_DEMO_VIDEO_ID,
    tiers: WEB_TIERS,
  },
};

// Plans sold only in their offer's cycles; the others also have more cycles on /pricing.
const FIXED_CYCLE = new Set([GMB_PLAN.title, ...OUTREACH_TIERS.map((t) => t.title)]);

/** Billing cycles the buyer can pick for an offer, shortest first (`offer.cycle` is the default). */
export const offerCycles = (offer) => offer.cycles || [offer.cycle];

/** The offer's cycle if `cycle` is one it sells, else its default. */
export const pickCycle = (offer, cycle) => (offerCycles(offer).includes(cycle) ? cycle : offer.cycle);

export const cycleInfo = (offer, cycle) => CYCLES[pickCycle(offer, cycle)] || CYCLES.yearly;

/** A tier with its `byCycle` overrides (price, features) for `cycle` applied. */
export const tierForCycle = (tier, cycle) => ({ ...tier, ...(tier.byCycle?.[cycle] || {}) });

/** Price for one billing period: { ...tier, cycle, months, price, gst, total, savePct }. */
export function offerPricing(offer, baseTier, wantedCycle) {
  const cycle = pickCycle(offer, wantedCycle);
  const tier = tierForCycle(baseTier, cycle);
  const { months } = CYCLES[cycle];
  const price = tier.perMonth * months;
  const gst = Math.round(price * GST_RATE);
  const savePct = tier.listPerMonth ? Math.round((1 - tier.perMonth / tier.listPerMonth) * 100) : 0;
  return { ...tier, cycle, months, price, gst, total: price + gst, savePct };
}

/** A tier in the shape ServiceBookingModal / Razorpay checkout expects. */
export function toOfferCheckoutPlan(offer, tier, cycle) {
  const p = offerPricing(offer, tier, cycle);
  return {
    title: p.title,
    planType: "our-package",
    planDuration: p.cycle,
    subtitle: p.tagline,
    features: p.features,
    price: formatInr(p.price),
    gstAmount: formatInr(p.gst),
    totalPrice: p.total,
  };
}

/** { offer, tier, fixedCycle } for a plan title, for server-side pricing; null if unknown. */
export function offerTierByTitle(title) {
  for (const offer of Object.values(PLAN_OFFERS)) {
    const tier = offer.tiers.find((t) => t.title === title);
    if (tier) return { offer, tier, fixedCycle: FIXED_CYCLE.has(title) };
  }
  return null;
}

// ── Cart ────────────────────────────────────────────────────────────────

const MAX_CART_ITEMS = 10;

/**
 * Validates and prices a cart of { offer, tier, cycle } keys on the server.
 * One plan per offer. Returns { lines, total } or { error }.
 * Each line: { offerKey, tierKey, title, cycle, months, price, gst, total }.
 */
export function priceCart(items) {
  if (!Array.isArray(items) || !items.length) return { error: "Your cart is empty" };
  if (items.length > MAX_CART_ITEMS) return { error: "Too many items in the cart" };
  const seen = new Set();
  const lines = [];
  for (const item of items) {
    const offer = PLAN_OFFERS[item?.offer];
    const tier = offer?.tiers.find((t) => t.key === item?.tier);
    if (!offer || !tier) return { error: "A plan in your cart is no longer available" };
    if (seen.has(offer.key)) return { error: "Only one plan per service can be bought at a time" };
    seen.add(offer.key);
    if (item.cycle && !offerCycles(offer).includes(item.cycle)) return { error: `${tier.title} is not sold ${item.cycle}` };
    const p = offerPricing(offer, tier, item.cycle);
    lines.push({
      offerKey: offer.key,
      tierKey: tier.key,
      title: tier.title,
      cycle: p.cycle,
      months: p.months,
      price: p.price,
      gst: p.gst,
      total: p.total,
    });
  }
  return { lines, total: lines.reduce((sum, l) => sum + l.total, 0) };
}

/** Compact cart for Razorpay order notes ("gmb:gmb:yearly|seo:basic-seo:monthly"), and back. */
export const encodeCart = (lines) => lines.map((l) => `${l.offerKey}:${l.tierKey}:${l.cycle}`).join("|");
export const decodeCart = (text) =>
  String(text || "")
    .split("|")
    .filter(Boolean)
    .map((pair) => {
      const [offer, tier, cycle] = pair.split(":"); // older notes have no cycle (= the default)
      return { offer, tier, ...(cycle ? { cycle } : {}) };
    });
