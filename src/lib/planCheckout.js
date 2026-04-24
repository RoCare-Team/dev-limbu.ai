import { getPublicSiteUrl } from "./siteUrl"

export function calculatePriceForCycle(basePrice, billingCycle) {
  if (billingCycle === "monthly") return basePrice
  if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.9)
  if (billingCycle === "half-yearly") return Math.round(basePrice * 6 * 0.85)
  if (billingCycle === "yearly") return Math.round(basePrice * 12 * 0.8)
  return basePrice
}

export function getMultiplierForCycle(billingCycle) {
  if (billingCycle === "monthly") return 1
  if (billingCycle === "quarterly") return 3
  if (billingCycle === "half-yearly") return 6
  if (billingCycle === "yearly") return 12
  return 1
}

/** @param {string} cycle */
export function normalizeBillingCycle(cycle) {
  const c = (cycle || "monthly").toLowerCase()
  if (["monthly", "quarterly", "half-yearly", "yearly"].includes(c)) return c
  return "monthly"
}

export function buildSubscriptionModalPlan(plan, billingCycle) {
  const cycle = normalizeBillingCycle(billingCycle)
  const multiplier = getMultiplierForCycle(cycle)
  const price = calculatePriceForCycle(plan.basePrice, cycle)
  const gst = Math.round(price * 0.18)
  const total = price + gst
  const dynamicFeatures = [
    `${plan.basePosts * multiplier} GMB Posts`,
    `${plan.baseCitations * multiplier} Citations`,
    ...plan.staticFeatures,
  ]
  return {
    title: plan.title,
    planKey: plan.planKey,
    purchaseLink: plan.purchaseLink || "",
    planType: "our-package",
    planDuration: cycle,
    price: `₹${price.toLocaleString()}`,
    period:
      cycle === "monthly"
        ? "/ month"
        : cycle === "quarterly"
          ? "/ quarter"
          : cycle === "half-yearly"
            ? "/ 6 months"
            : "/ year",
    gstAmount: `₹${gst.toLocaleString()}`,
    totalPrice: `₹${total.toLocaleString()}`,
    subtitle: plan.description,
    features: dynamicFeatures,
    tag: plan.description,
    buttonColor: plan.color,
  }
}

const PLAN_GROUPS = [
  { key: "subscriptionPlans", kind: "subscription" },
  { key: "servicePlans", kind: "service" },
  { key: "webDevelopmentPlans", kind: "web" },
  { key: "seoPlans", kind: "seo" },
  { key: "accountSetupPlans", kind: "account" },
]

export function findPlanByKey(pricing, planKey) {
  if (!planKey || !pricing || typeof pricing !== "object") return null
  for (const { key, kind } of PLAN_GROUPS) {
    const arr = pricing[key]
    if (!Array.isArray(arr)) continue
    const plan = arr.find((p) => p?.planKey === planKey)
    if (plan) return { plan, kind }
  }
  return null
}

/**
 * Build absolute checkout URL for chatbot / API (same path the site uses).
 */
export function buildCheckoutUrl(planKey, billingCycle) {
  const base = getPublicSiteUrl()
  const q = new URLSearchParams({ planKey })
  const cycle = normalizeBillingCycle(billingCycle)
  if (cycle !== "monthly") q.set("cycle", cycle)
  return `${base}/checkout?${q.toString()}`
}

/**
 * Shape `selectedPlan` for ServiceBookingModal + Razorpay (same as landing sections).
 */
export function buildModalPlanForCheckout(found, billingCycle = "monthly") {
  const { plan, kind } = found
  const cycle = normalizeBillingCycle(billingCycle)

  if (kind === "subscription") {
    const m = buildSubscriptionModalPlan(plan, cycle)
    return {
      ...m,
      purchaseLink: buildCheckoutUrl(plan.planKey, cycle),
    }
  }

  if (kind === "service") {
    return {
      ...plan,
      planKey: plan.planKey,
      purchaseLink: plan.purchaseLink || "",
    }
  }

  if (kind === "web") {
    return {
      ...plan,
      planType: "web-development",
      planDuration: "One-time",
      price: `₹${plan.basePrice.toLocaleString()}`,
      gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
      totalPrice: `₹${Math.round(plan.basePrice * 1.18).toLocaleString()}`,
      subtitle: plan.description,
      purchaseLink: plan.purchaseLink || "",
    }
  }

  if (kind === "seo") {
    return {
      ...plan,
      planType: "seo",
      planDuration: "Monthly",
      price: `₹${plan.basePrice.toLocaleString()}`,
      gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
      totalPrice: Math.round(plan.basePrice * 1.18),
      subtitle: plan.description,
      purchaseLink: plan.purchaseLink || "",
    }
  }

  if (kind === "account") {
    return {
      ...plan,
      planType: "account-setup",
      planDuration: "One-time",
      price: `₹${plan.basePrice.toLocaleString()}`,
      gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
      totalPrice: Math.round(plan.basePrice * 1.18),
      subtitle: plan.description,
      purchaseLink: plan.purchaseLink || "",
    }
  }

  return plan
}
