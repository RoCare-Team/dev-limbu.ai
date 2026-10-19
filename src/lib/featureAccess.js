import Pricing from "@/models/Pricing";

/**
 * Pay-per-open access for the Google Business Profile tools in the app.
 *
 * The keys here are the SAME tile keys /api/home-sections serves, so the app
 * can post back exactly the key it already has for that tile.
 *
 * Rules, as agreed:
 *  - An active plan unlocks every feature here, free.
 *  - Without a plan each OPEN costs coins (default 5 — ₹5, since 1 coin = ₹1).
 *    It is charged per access, not once, so the app must call POST only at the
 *    moment the user actually opens the tool.
 */

/** Tiles that are plan-or-pay: the GBP tools and the social media tools. */
export const FEATURES = [
  { key: "gbp_insight", label: "GBP Insight", group: "gbp" },
  { key: "health_score", label: "Health Score", group: "gbp" },
  { key: "gbp_create_post", label: "Create Post", group: "gbp" },
  { key: "review_reply", label: "Review Reply", group: "gbp" },
  { key: "magic_qr", label: "Magic QR", group: "gbp" },
  { key: "website_builder", label: "Website Builder", group: "gbp" },

  { key: "social_create_post", label: "Create Post", group: "social" },
  { key: "social_insights", label: "Insights", group: "social" },
  { key: "social_dm", label: "DM", group: "social" },
  { key: "social_comment", label: "Comment", group: "social" },
  { key: "social_like", label: "Like", group: "social" },
];

/**
 * The AI video tools are NOT pay-per-open: they already meter coins on the
 * generation itself. The app shows these rates so a user knows the cost before
 * starting. `unit: "second"` means the coins are charged per second of video.
 */
export const COIN_BASED_TILES = {
  // `pricingField` reads the live rate off the Pricing doc, so an admin can
  // change it without a deploy; `fallback` is used when the doc has no value.
  social_create_reels: {
    pricingField: "videoGeneratePrice",
    fallback: 200,
    unit: "video",
  },
  text_to_video: { pricingField: "texttovideo", fallback: 180, unit: "video" },
  image_to_video: { coins: 200, unit: "video" },
  ai_avatar_video: { coins: 20, unit: "second" },
  cgi_video: { coins: 30, unit: "second" },
};

/** Resolves every coin-metered tile's rate in one Pricing read. */
export async function getCoinBasedRates() {
  const pricing = (await Pricing.findOne().lean()) || {};
  const out = {};

  for (const [key, cfg] of Object.entries(COIN_BASED_TILES)) {
    const fromDoc = cfg.pricingField ? Number(pricing[cfg.pricingField]) : NaN;
    const coins = Number.isFinite(fromDoc) && fromDoc > 0
      ? fromDoc
      : Number(cfg.coins ?? cfg.fallback) || 0;
    out[key] = { coins, unit: cfg.unit };
  }

  return out;
}

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

/** Fallback when no Pricing doc exists yet. */
export const DEFAULT_FEATURE_ACCESS_PRICE = 5;

export function isValidFeature(key) {
  return FEATURE_KEYS.includes(String(key || "").trim());
}

/** Coins charged for one open. Admin can change it on the Pricing doc. */
export async function getFeatureAccessPrice() {
  const pricing = await Pricing.findOne().lean();
  const price = Number(pricing?.featureAccessPrice);
  return Number.isFinite(price) && price >= 0
    ? price
    : DEFAULT_FEATURE_ACCESS_PRICE;
}

/**
 * Does this user have a running plan?
 *
 * `planApprovalStatus` is deliberately NOT part of this: live data shows paid
 * users sitting on "pending" forever, so requiring approval would charge people
 * who have already paid.
 */
export function getPlanState(user) {
  const name = (user?.paidPackage || "").trim();
  const expiry = user?.packageExpiryDate
    ? new Date(user.packageExpiryDate)
    : null;
  const valid = expiry && !Number.isNaN(expiry.getTime());
  const active = Boolean(name) && valid && expiry.getTime() > Date.now();

  return {
    active,
    name: name || null,
    expiresAt: valid ? expiry.toISOString() : null,
    daysLeft:
      active && valid
        ? Math.ceil((expiry.getTime() - Date.now()) / 86400000)
        : 0,
  };
}

/** The per-feature list the app renders: locked state, price, affordability. */
export function buildFeatureList({ plan, wallet, price }) {
  return FEATURES.map((f) => ({
    ...f,
    locked: !plan.active,
    charge: plan.active ? 0 : price,
    canAccess: plan.active || wallet >= price,
    accessVia: plan.active ? "plan" : "coins",
  }));
}
