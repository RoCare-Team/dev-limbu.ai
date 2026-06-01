import { getPublicSiteUrl } from "./siteUrl"

/** WhatsApp / chatbot checkout links use this discount (query `discount=10`). */
export const CHATBOT_CHECKOUT_DISCOUNT_PERCENT = 10

export const CHECKOUT_GST_RATE = 0.18

export function applyPercentDiscount(amount, percent = CHATBOT_CHECKOUT_DISCOUNT_PERCENT) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return amount
  const p = Math.min(100, Math.max(0, Number(percent) || 0))
  return Math.round(n * (1 - p / 100))
}

/** GST on plan price only (not on a pre-discounted total). */
export function calculateGstOnPlanPrice(planPrice) {
  const n = Number(planPrice)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * CHECKOUT_GST_RATE)
}

/** Discount plan price, then 18% GST on discounted base. */
export function applyDiscountToPlanPriceWithGst(planPrice, discountPercent) {
  const discountedPrice = applyPercentDiscount(planPrice, discountPercent)
  const gst = calculateGstOnPlanPrice(discountedPrice)
  return { planPrice: discountedPrice, gst, total: discountedPrice + gst }
}

function parseRupeeAmount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return null
  const digits = value.replace(/[^\d]/g, "")
  if (!digits) return null
  return parseInt(digits, 10)
}

function formatRupeeAmount(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`
}

/** Appends `discount=10` to checkout URLs returned to chatbot / home-data API. */
export function appendChatbotDiscountToCheckoutUrl(url) {
  if (!url || typeof url !== "string") return url
  const trimmed = url.trim()
  if (!trimmed) return url
  if (/[?&]discount=/i.test(trimmed)) return trimmed

  try {
    const u = new URL(trimmed)
    u.searchParams.set("discount", String(CHATBOT_CHECKOUT_DISCOUNT_PERCENT))
    return u.toString()
  } catch {
    const sep = trimmed.includes("?") ? "&" : "?"
    return `${trimmed}${sep}discount=${CHATBOT_CHECKOUT_DISCOUNT_PERCENT}`
  }
}

function resolvePlanPriceAmount(plan) {
  if (!plan || typeof plan !== "object") return null
  if (typeof plan.basePrice === "number" && Number.isFinite(plan.basePrice)) {
    return plan.basePrice
  }
  return parseRupeeAmount(plan.price)
}

function setPlanPriceFields(out, plan, { planPrice, gst, total }) {
  if (typeof plan.basePrice === "number") {
    out.basePrice = planPrice
    if (typeof plan.gst === "number") out.gst = gst
    if (typeof plan.totalAmount === "number") out.totalAmount = total
    if (typeof plan.ios_price === "number") out.ios_price = total
  }

  if (plan.price != null && plan.price !== "") {
    out.price =
      typeof plan.price === "number" ? planPrice : formatRupeeAmount(planPrice)
  }
  if (plan.gstAmount != null && plan.gstAmount !== "") {
    out.gstAmount =
      typeof plan.gstAmount === "number" ? gst : formatRupeeAmount(gst)
  }
  if (plan.totalPrice != null && plan.totalPrice !== "") {
    out.totalPrice =
      typeof plan.totalPrice === "number" ? total : formatRupeeAmount(total)
  }
}

/** Discounts plan price only; GST and total recalculated at 18% on discounted base. */
export function applyChatbotDiscountToPlan(plan) {
  if (!plan || typeof plan !== "object") return plan
  const planPrice = resolvePlanPriceAmount(plan)
  if (planPrice == null) return plan

  const { planPrice: discounted, gst, total } = applyDiscountToPlanPriceWithGst(
    planPrice,
    CHATBOT_CHECKOUT_DISCOUNT_PERCENT,
  )
  const out = { ...plan, chatbotDiscountPercent: CHATBOT_CHECKOUT_DISCOUNT_PERCENT }
  setPlanPriceFields(out, plan, {
    planPrice: discounted,
    gst,
    total,
  })
  return out
}

/** Applies URL `discount` param when opening /checkout from a chatbot payment link. */
export function applyDiscountToModalPlan(plan, discountPercent) {
  if (!plan || !discountPercent) return plan
  const pct = Number(discountPercent)
  if (!Number.isFinite(pct) || pct <= 0) return plan

  const planPrice = resolvePlanPriceAmount(plan)
  if (planPrice == null) return plan

  const { planPrice: discounted, gst, total } = applyDiscountToPlanPriceWithGst(
    planPrice,
    pct,
  )
  const out = { ...plan, chatbotDiscountPercent: pct }
  setPlanPriceFields(out, plan, { planPrice: discounted, gst, total })
  return out
}

export function parseCheckoutDiscountPercent(searchParams) {
  const raw =
    typeof searchParams?.get === "function"
      ? searchParams.get("discount")
      : searchParams?.discount
  if (raw == null || raw === "") return 0
  const n = parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n <= 0 || n > 100) return 0
  return n
}

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
