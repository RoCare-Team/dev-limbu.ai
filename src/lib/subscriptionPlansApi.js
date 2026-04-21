import { getPublicSiteUrl } from "./siteUrl"
import { buildCheckoutUrl, normalizeBillingCycle } from "./planCheckout"

/**
 * Default title → planKey for subscription catalog (matches pricingLanding / checkout).
 * Used when Mongo `subscriptionPlans` docs omit planKey.
 */
const SUBSCRIPTION_TITLE_TO_PLAN_KEY = {
  "Basic Plan": "subscription-basic",
  "Premium Plan": "subscription-premium",
  "Professional Plan": "subscription-professional",
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
export function expandSubscriptionPlansForApi(data) {
  if (!data || typeof data !== "object") return data
  const billingCycles = data.billingCycles
  if (!Array.isArray(billingCycles)) return data

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

          const out = { ...plan, paymentLink }
          if (inferredKey && !plan.planKey) {
            out.planKey = inferredKey
          }
          return out
        })
      : cycle.plans

    return { ...cycle, plans }
  })

  return { ...data, billingCycles: billingCyclesOut }
}
