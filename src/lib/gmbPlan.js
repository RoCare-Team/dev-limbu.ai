import { GST_RATE, formatInr } from "@/lib/seoPlans";

/**
 * The monthly plan that unlocks every Google Business Profile tool on the
 * home page. "GMB Plan" is in the `gmb` plan group (lib/userPlans.js), so
 * buying it unlocks the same tools as Basic / Professional / Premium.
 */
export const GMB_PLAN = {
  title: "GMB Plan",
  basePrice: 999,
  description: "Every Google Business Profile tool, unlocked for a month",
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

export const GMB_GST = Math.round(GMB_PLAN.basePrice * GST_RATE);
export const GMB_TOTAL = GMB_PLAN.basePrice + GMB_GST;

/** GMB Plan in the shape ServiceBookingModal / Razorpay checkout expects. */
export function gmbCheckoutPlan() {
  return {
    title: GMB_PLAN.title,
    planType: "our-package",
    planDuration: "monthly",
    subtitle: GMB_PLAN.description,
    features: GMB_PLAN.staticFeatures,
    price: formatInr(GMB_PLAN.basePrice),
    gstAmount: formatInr(GMB_GST),
    totalPrice: GMB_TOTAL,
  };
}
