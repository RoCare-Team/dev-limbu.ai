import {
  CHECKOUT_TEST_PLAN_KEY,
  getCheckoutTestPlanForSubscriptionApi,
} from "./checkoutTestPlan"
import { getPublicSiteUrl } from "./siteUrl"
import {
  appendChatbotDiscountToCheckoutUrl,
  applyChatbotDiscountToPlan,
  buildCheckoutUrl,
  normalizeBillingCycle,
} from "./planCheckout"

/**
 * Default title → planKey for subscription catalog (matches pricingLanding / checkout).
 * Used when Mongo `subscriptionPlans` docs omit planKey.
 */
const SUBSCRIPTION_TITLE_TO_PLAN_KEY = {
  "Basic Plan": "subscription-basic",
  "Basic Plan (Test)": "subscription-basic-test",
  "Premium Plan": "subscription-premium",
  "Professional Plan": "subscription-professional",
}

/**
 * How much more an iOS purchase costs than the same plan bought on the web.
 *
 * Apple takes a commission on in-app purchases, so the iOS price has to sit
 * above the web price for the plan to earn the same. 15% on the GST-inclusive
 * total — i.e. a ₹4,800 quarterly plan is ₹4,800 + ₹864 GST = ₹5,664, and
 * ₹6,514 on iOS.
 */
export const IOS_PRICE_UPLIFT = 0.15

const DEFAULT_GST_RATE = 18

/**
 * The iOS price for one plan, from its real (undiscounted) web price.
 *
 * Two things this has to get right, both of which were wrong before:
 *  - It must use the plan's ORIGINAL basePrice. The API applies a 10% chatbot
 *    discount to every subscription plan, and iOS pricing must not inherit a
 *    marketing discount.
 *  - It must be applied AFTER applyChatbotDiscountToPlan, because that helper
 *    overwrites ios_price with the discounted total — which is why the stored
 *    ios_price values never reached the app.
 */
function computeIosPrice(plan, gstRate = DEFAULT_GST_RATE) {
  // A plan can pin its exact App Store tier, because Apple only sells at its
  // own price points — the uplift below just lands near one, not on it.
  const override = Number(plan?.iosPriceOverride)
  if (Number.isFinite(override) && override > 0) return override

  const base = Number(plan?.basePrice)
  if (!Number.isFinite(base) || base <= 0) return null

  const rate = Number.isFinite(Number(gstRate)) ? Number(gstRate) : DEFAULT_GST_RATE
  // Prefer the stored GST so a plan with a hand-set figure keeps it.
  const gst = Number.isFinite(Number(plan?.gst))
    ? Number(plan.gst)
    : Math.round(base * (rate / 100))

  return Math.round((base + gst) * (1 + IOS_PRICE_UPLIFT))
}

function inferPlanKeyFromTitle(title) {
  const t = typeof title === "string" ? title.trim() : ""
  if (!t) return ""
  if (SUBSCRIPTION_TITLE_TO_PLAN_KEY[t]) return SUBSCRIPTION_TITLE_TO_PLAN_KEY[t]
  const lower = t.toLowerCase()
  for (const [key, planKey] of Object.entries(SUBSCRIPTION_TITLE_TO_PLAN_KEY)) {
    if (key.toLowerCase() === lower) return planKey
  }
  return ""
}

/**
 * Resolves the subscription catalog object from a HomeData lean document.
 * Supports normal `{ data: { billingCycles } }` and broken/legacy shapes.
 */
export function getSubscriptionPlansPayloadForExpand(doc) {
  if (!doc || typeof doc !== "object") return null

  const inner = doc.data
  if (
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    Array.isArray(inner.billingCycles)
  ) {
    return { ...inner }
  }

  if (Array.isArray(doc.billingCycles)) {
    return {
      ...(doc.currency != null && { currency: doc.currency }),
      ...(doc.gstRate != null && { gstRate: doc.gstRate }),
      billingCycles: doc.billingCycles,
    }
  }

  if (typeof inner === "string") {
    try {
      const parsed = JSON.parse(inner)
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.billingCycles)) {
        return { ...parsed }
      }
    } catch (_) {
      /* ignore */
    }
  }

  return null
}

function toAbsoluteUrl(pathOrUrl) {
  const raw = (pathOrUrl || "").trim()
  if (!raw) return ""
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
  const base = getPublicSiteUrl()
  const path = raw.startsWith("/") ? raw : `/${raw}`
  return `${base}${path}`
}

/**
 * Adds absolute `paymentLink` (and optional `planKey`) on each plan for chatbot / external APIs.
 * Stored `paymentLink` wins if it is already an absolute URL.
 */
function injectTestPlanIntoBillingCycles(data) {
  if (!data || typeof data !== "object") {
    return data
  }
  if (!Array.isArray(data.billingCycles)) return data
  const cycles = data.billingCycles.map((c) => ({
    ...c,
    plans: Array.isArray(c.plans) ? [...c.plans] : [],
  }))
  const monthlyIdx = cycles.findIndex(
    (c) => normalizeBillingCycle(c.cycle) === "monthly",
  )
  if (monthlyIdx === -1) return data
  const monthly = cycles[monthlyIdx]
  if (monthly.plans.some((p) => p?.planKey === CHECKOUT_TEST_PLAN_KEY)) {
    return { ...data, billingCycles: cycles }
  }
  monthly.plans = [...monthly.plans, getCheckoutTestPlanForSubscriptionApi()]
  return { ...data, billingCycles: cycles }
}

export function expandSubscriptionPlansForApi(data) {
  if (!data || typeof data !== "object") return data
  const dataWithTest = injectTestPlanIntoBillingCycles(data)
  const billingCycles = dataWithTest.billingCycles
  if (!Array.isArray(billingCycles)) return dataWithTest

  const billingCyclesOut = billingCycles.map((cycle) => {
    if (!cycle || typeof cycle !== "object") return cycle
    const cycleKey = normalizeBillingCycle(cycle.cycle)
    const plans = Array.isArray(cycle.plans)
      ? cycle.plans.map((plan) => {
          if (!plan || typeof plan !== "object") return plan
          const title = typeof plan.title === "string" ? plan.title.trim() : ""
          const inferredKey =
            plan.planKey || inferPlanKeyFromTitle(title) || ""

          const explicitAbs =
            typeof plan.paymentLink === "string" &&
            /^https?:\/\//i.test(plan.paymentLink.trim())
              ? plan.paymentLink.trim()
              : ""

          const relative =
            !explicitAbs &&
            (plan.paymentLink || plan.purchaseLink || "").trim()

          let paymentLink = explicitAbs
          if (!paymentLink && inferredKey) {
            paymentLink = buildCheckoutUrl(inferredKey, cycleKey)
          }
          if (!paymentLink && relative) {
            paymentLink = toAbsoluteUrl(relative)
          }

          const link = appendChatbotDiscountToCheckoutUrl(paymentLink)
          const out = applyChatbotDiscountToPlan({
            ...plan,
            paymentLink: link,
            planLink: link,
          })
          if (inferredKey && !plan.planKey) {
            out.planKey = inferredKey
          }

          // Set last, from the ORIGINAL plan: applyChatbotDiscountToPlan above
          // replaces ios_price with the discounted total, so anything written
          // before this point is lost.
          const ios = computeIosPrice(plan, dataWithTest.gstRate)
          if (ios != null) out.ios_price = ios

          return out
        })
      : cycle.plans

    return { ...cycle, plans }
  })

  return { ...dataWithTest, billingCycles: billingCyclesOut }
}
