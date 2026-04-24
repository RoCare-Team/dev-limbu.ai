/**
 * ₹1 Razorpay smoke-test for the Basic subscription checkout (`subscription-basic-test`).
 * Always merged for `/checkout?planKey=subscription-basic-test`. Never shown on the home
 * “Our Package” block (`listOnHomepage: false` — also enforced in expand + section filter).
 */

export const CHECKOUT_TEST_PLAN_KEY = "subscription-basic-test"

export function isCheckoutTestPlanEnabled() {
  if (process.env.NEXT_PUBLIC_ENABLE_CHECKOUT_TEST_PLAN === "true") {
    return true
  }
  return process.env.NODE_ENV === "development"
}

export function isCheckoutTestPlanKey(planKey) {
  return typeof planKey === "string" && planKey === CHECKOUT_TEST_PLAN_KEY
}

/** Merged into pricingLanding (home + /checkout findPlanByKey). */
export function getCheckoutTestSubscriptionPlanForLanding() {
  return {
    planKey: CHECKOUT_TEST_PLAN_KEY,
    purchaseLink: `/checkout?planKey=${CHECKOUT_TEST_PLAN_KEY}`,
    listOnHomepage: false,
    title: "Basic Plan (Test)",
    basePrice: 1,
    totalAmount: 1,
    basePosts: 15,
    baseCitations: 5,
    staticFeatures: [
      "Review Reply System",
      "Magic Qr Code Generation",
      "Insights Dashboard",
      "Category Addition & Optimization",
      "Website Builder",
    ],
    description: "Test only — ₹1 via Razorpay; same flow as Basic Plan",
    color: "bg-amber-700",
    textColor: "text-dark",
    borderColor: "border-amber-300",
  }
}

/** One row for subscriptionPlans / home-data billingCycles.monthly.plans[]. */
export function getCheckoutTestPlanForSubscriptionApi() {
  const p = getCheckoutTestSubscriptionPlanForLanding()
  const gst = Math.round(p.basePrice * 0.18)
  return {
    title: p.title,
    basePrice: p.basePrice,
    gst,
    totalAmount: p.basePrice + gst,
    ios_price: p.basePrice + gst,
    duration: "month",
    save: 0,
    posts: p.basePosts,
    citations: p.baseCitations,
    features: [...p.staticFeatures],
    planKey: CHECKOUT_TEST_PLAN_KEY,
    paymentLink: "",
  }
}

export function appendCheckoutTestPlanToLanding(merged) {
  if (!merged || typeof merged !== "object") {
    return merged
  }
  const plans = Array.isArray(merged.subscriptionPlans)
    ? merged.subscriptionPlans
    : []
  if (plans.some((p) => p?.planKey === CHECKOUT_TEST_PLAN_KEY)) {
    return merged
  }
  return {
    ...merged,
    subscriptionPlans: [...plans, getCheckoutTestSubscriptionPlanForLanding()],
  }
}
