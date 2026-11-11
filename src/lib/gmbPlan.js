/**
 * The plan that unlocks every Google Business Profile tool on the home page,
 * sold yearly at ₹999/month. "GMB Plan" is in the `gmb` plan group
 * (lib/userPlans.js), so buying it unlocks the same tools as Basic /
 * Professional / Premium.
 */
export const GMB_PLAN = {
  title: "GMB Plan",
  basePrice: 999, // per month on the yearly cycle — the headline price
  description: "Every Google Business Profile tool, unlocked for your whole plan",
  staticFeatures: [
    "GMB Insights & Health Score",
    "AI Post Management",
    "AI Review Replies",
    "Magic QR for 5-star reviews",
    "Assets Management",
    "Keyword Planner & Competitor Analysis",
    "Website Builder",
  ],
};

// Website card copy for the GMB tools, keyed by home-section item key.
export const GMB_TOOL_COPY = {
  gbp_insight: { label: "GMB Insights", description: "Calls, views and direction requests in one clear report" },
  health_score: { label: "Profile Health Score", description: "Find and fix what is holding your profile back" },
  gbp_create_post: { label: "AI Post Scheduler", description: "Fresh Google posts written and published for you" },
  review_reply: { label: "AI Review Replies", description: "Every review answered in seconds, in your tone" },
  magic_qr: { label: "Magic Review QR", description: "One scan takes customers straight to your review page" },
  assets_management: { label: "Photos & Videos", description: "Upload and manage your listing media in one place" },
  keyword_planner: { label: "Keyword Planner", description: "Discover what local customers search for" },
  competitor_analysis: { label: "Competitor Analysis", description: "See how you rank against nearby businesses" },
  website_builder: { label: "Website Builder", description: "A ready website built from your Google profile" },
};

// Same demo the home page "Watch Demo" button plays.
export const GMB_DEMO_VIDEO_ID = "eQUd6u36w3g";

// Plans offered in the unlock modal, all billed yearly. Annual price follows the
// pricing page rule (yearly = 50% off the monthly list price), except the GMB Plan,
// which is ₹999/month yearly by design. Pricing helpers live in lib/planOffers.js.
export const GMB_TIERS = [
  {
    key: "gmb",
    title: GMB_PLAN.title,
    tagline: "All GMB tools, do-it-yourself",
    perMonth: GMB_PLAN.basePrice,
    listPerMonth: null,
    features: GMB_PLAN.staticFeatures,
    addon: "Unlock all GMB tools",
  },
  {
    key: "professional",
    title: "Professional Plan",
    tagline: "Best for growing businesses looking for better visibility",
    perMonth: 1750,
    listPerMonth: 3500,
    // Same as the pricing page on the yearly cycle (20 posts / 5 citations a month)
    features: [
      "240 GMB Posts",
      "60 Citations",
      "Review Reply Management",
      "Custom QR Code Generation",
      "Business Insights Dashboard",
      "Category Setup & Optimization",
      "Social Media Management",
    ],
    addon: "Unlock all GMB tools",
  },
  {
    key: "premium",
    title: "Premium Plan",
    tagline: "Perfect for brands focused on automation and maximum reach",
    perMonth: 2750,
    listPerMonth: 5500,
    popular: true,
    // Same as the pricing page on the yearly cycle (30 posts / 10 citations a month)
    features: [
      "360 GMB Posts",
      "120 Citations",
      "Review Reply Management",
      "Custom QR Code Generation",
      "Business Insights Dashboard",
      "Category Addition & Optimization",
      "Social Media Management",
    ],
    addon: "Unlock all GMB tools",
  },
];
