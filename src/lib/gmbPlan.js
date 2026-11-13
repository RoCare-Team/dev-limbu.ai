/**
 * The plan that unlocks every Google Business Profile tool on the home page,
 * sold yearly at ₹999/month or quarterly at the pricing page Basic Plan rate. "GMB Basic Plan" is in the `gmb` plan group
 * (lib/userPlans.js), so buying it unlocks the same tools as Basic /
 * Professional / Premium.
 */
export const GMB_PLAN = {
  title: "GMB Basic Plan",
  basePrice: 999, // per month on the yearly plan — the headline price
  listPrice: 2000, // pricing page Basic Plan, per month (quarterly = 20% off)
  description: "Every Google Business Profile tool, unlocked for your whole plan",
  staticFeatures: [
    "GMB Insights & Health Score",
    "AI Post Management",
    "Review Management",
    "Magic QR for 5-star reviews",
    "Assets Management",
    "Keyword Planner & Competitor Analysis",
    "Website Builder",
  ],
};

// Website card copy for the GMB tools, keyed by home-section item key.
/**
 * Order of the GMB tiles on the website, as a customer uses them: research
 * (keywords, competitors), fix the profile, then post, reviews, QR, brand
 * assets, results and the website. Tiles not listed keep their order at the end.
 */
export const GMB_TOOL_ORDER = [
  "keyword_planner",
  "competitor_analysis",
  "health_score",
  "gbp_create_post",
  "review_reply",
  "magic_qr",
  "assets_management",
  "gbp_insight",
  "website_builder",
];

export const GMB_TOOL_COPY = {
  gbp_insight: { label: "GMB Insights", description: "Calls, views and direction requests in one clear report" },
  health_score: { label: "Profile Health Score", description: "Find and fix what is holding your profile back" },
  gbp_create_post: { label: "Post Management", description: "AI writes and publishes your Google posts" },
  review_reply: { label: "Review Management", description: "Every review answered in seconds, in your tone" },
  magic_qr: { label: "Magic Review QR", description: "One scan takes customers straight to your review page" },
  assets_management: { label: "Assets Management", description: "Your logo and brand images, used in every AI post" },
  keyword_planner: { label: "Keyword Planner", description: "Discover what local customers search for" },
  competitor_analysis: { label: "Competitor Analysis", description: "See how you rank against nearby businesses" },
  website_builder: { label: "Website Builder", description: "A ready website built from your Google profile" },
};

// Same demo the home page "Watch Demo" button plays.
export const GMB_DEMO_VIDEO_ID = "eQUd6u36w3g";

// Plans offered in the unlock modal, billed quarterly or yearly. Prices follow the
// pricing page rule (quarterly = 20% off the monthly list price, yearly = 50% off),
// except the GMB Basic Plan: the pricing page Basic Plan price quarterly (₹2,000 − 20%
// = ₹1,600/month) and ₹999/month yearly. `byCycle` holds what
// changes on the yearly cycle; pricing helpers live in lib/planOffers.js.

// Posts / citations a month and the fixed features, as on the pricing page.
const gmbPackageFeatures = (posts, citations, extras, months) => [
  `${posts * months} GMB Posts`,
  `${citations * months} Citations`,
  ...extras,
  // Annual-only perk on the pricing page
  ...(months === 12 ? ["Social Media Management"] : []),
];

const PRO_EXTRAS = ["Review Reply Management", "Custom QR Code Generation", "Business Insights Dashboard", "Category Setup & Optimization"];
const PREMIUM_EXTRAS = ["Review Reply Management", "Custom QR Code Generation", "Business Insights Dashboard", "Category Addition & Optimization"];

export const GMB_TIERS = [
  {
    key: "gmb",
    title: GMB_PLAN.title,
    tagline: "All GMB tools, do-it-yourself",
    perMonth: Math.round(GMB_PLAN.listPrice * 0.8), // ₹1,600 — same as the pricing page quarterly
    listPerMonth: GMB_PLAN.listPrice,
    features: GMB_PLAN.staticFeatures,
    byCycle: { yearly: { perMonth: GMB_PLAN.basePrice } }, // ₹999 = 50% off ₹2,000
    addon: "Unlock all GMB tools",
  },
  {
    key: "professional",
    title: "Professional Plan",
    tagline: "Best for growing businesses looking for better visibility",
    perMonth: 2800,
    listPerMonth: 3500,
    features: gmbPackageFeatures(20, 5, PRO_EXTRAS, 3),
    byCycle: { yearly: { perMonth: 1750, features: gmbPackageFeatures(20, 5, PRO_EXTRAS, 12) } },
    addon: "Unlock all GMB tools",
  },
  {
    key: "premium",
    title: "Premium Plan",
    tagline: "Perfect for brands focused on automation and maximum reach",
    perMonth: 4400,
    listPerMonth: 5500,
    popular: true,
    features: gmbPackageFeatures(30, 10, PREMIUM_EXTRAS, 3),
    byCycle: { yearly: { perMonth: 2750, features: gmbPackageFeatures(30, 10, PREMIUM_EXTRAS, 12) } },
    addon: "Unlock all GMB tools",
  },
];
