// SEO packages — shown on /pricing and on every /seo-tools/<slug> page, so the
// prices stay the same everywhere. Prices are before 18% GST.

export const GST_RATE = 0.18;

export const SEO_PLANS = [
  {
    title: "Basic SEO",
    basePrice: 5999,
    staticFeatures: [
      "Keyword Research",
      "Meta Tags Optimization",
      "Basic Technical SEO",
      "Monthly Report",
      "5-7 Target Keyword",
    ],
    description: "Perfect for small websites starting SEO",
    color: "bg-neutral-500",
  },
  {
    title: "Standard SEO",
    basePrice: 9999,
    staticFeatures: [
      "Technical SEO Audit",
      "Backlink Building",
      "Competitor Analysis",
      "Bi-Weekly Reports",
      "15 Target Keywoord",
      "4 Seo Friendly Blogs",
    ],
    description: "For growing businesses that want steady rankings",
    popular: true,
    color: "bg-neutral-600",
  },
  {
    title: "Advanced SEO",
    basePrice: 15999,
    staticFeatures: [
      "25 Target keyword",
      "10 Seo Friendly  Blog",
      "Complete SEO Strategy",
      "High Quality Backlinks",
      "Technical Optimization",
      "Local SEO",
      "Weekly Report",
    ],
    description: "Full SEO for competitive markets",
    color: "bg-neutral-700",
  },
];

export const formatInr = (amount) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

/** Plan in the shape ServiceBookingModal / Razorpay checkout expects. */
export function toCheckoutPlan(plan) {
  const gst = Math.round(plan.basePrice * GST_RATE);
  return {
    title: plan.title,
    subtitle: plan.description,
    features: plan.staticFeatures,
    price: formatInr(plan.basePrice),
    gstAmount: formatInr(gst),
    totalPrice: formatInr(plan.basePrice + gst),
  };
}
