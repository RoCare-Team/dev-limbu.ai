import { PRICING_LANDING_DEFAULTS, mergePlanListWithDefaults } from "./pricingLandingDefaults"
import {
  appendChatbotDiscountToCheckoutUrl,
  applyChatbotDiscountToPlan,
  buildCheckoutUrl,
} from "./planCheckout"
import { IOS_PRICE_UPLIFT } from "./subscriptionPlansApi"

/**
 * Social media reel plans, shaped like the GMB package catalog.
 *
 * The first version of this endpoint returned a single flat list at the monthly
 * rate, which left two things wrong for anyone consuming it: the prices came
 * back 10% under what /pricing shows (the chatbot discount was being applied by
 * default), and there was no way to read the quarterly or yearly price at all
 * even though the page offers all three. Both are fixed here by mirroring the
 * `subscriptionPlans` shape — `billingCycles[]`, each with its own `plans[]` —
 * so a client reads social and GMB packages the same way.
 *
 * Prices match the /pricing cards exactly: the discount applies to the full
 * cycle total, and the reel count multiplies by the cycle's months.
 */

const GST_RATE = 18

/**
 * The cycles the Social Media section offers, with ITS discounts — 10%
 * quarterly and 20% yearly, which are deliberately not the GMB package's
 * 20/15/50 scheme.
 */
const SOCIAL_CYCLES = [
  { cycle: "monthly", label: "Monthly", months: 1, discount: 0, duration: "month" },
  { cycle: "quarterly", label: "Quarterly -10%", months: 3, discount: 10, duration: "quarter" },
  { cycle: "yearly", label: "Yearly -20%", months: 12, discount: 20, duration: "year" },
]

/** Pulls the saved plan list out of a HomeData doc, tolerating either shape. */
function readSavedPlans(doc) {
  const raw = doc?.data !== undefined ? doc.data : doc
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.socialMediaPlans)) return raw.socialMediaPlans
  return []
}

/**
 * Builds the full catalog.
 *
 * @param {object|null} doc the stored `socialMediaPlans` HomeData doc, if any
 * @param {{ applyChatbotDiscount?: boolean }} [options]
 *   `applyChatbotDiscount` defaults to FALSE so the numbers match the website.
 *   The chatbot asks for it explicitly when it wants to quote its 10% off.
 */
export function buildSocialMediaPlansPayload(doc, options = {}) {
  const applyChatbotDiscount = options.applyChatbotDiscount === true

  const plans = mergePlanListWithDefaults(
    PRICING_LANDING_DEFAULTS.socialMediaPlans,
    readSavedPlans(doc),
  )

  const billingCycles = SOCIAL_CYCLES.map((c) => ({
    cycle: c.cycle,
    label: c.label,
    discount: c.discount,
    plans: plans.map((plan) => {
      const monthly = Number(plan.basePrice) || 0
      // A plan may carry its own discounts; fall back to the section's.
      const ownDiscount = Number(plan.cycleDiscounts?.[c.cycle])
      const discountFraction = Number.isFinite(ownDiscount)
        ? ownDiscount
        : c.discount / 100

      const listPrice = monthly * c.months
      const basePrice = Math.round(listPrice * (1 - discountFraction))
      const gst = Math.round(basePrice * (GST_RATE / 100))
      const totalAmount = basePrice + gst
      const reels = (Number(plan.baseReels) || 0) * c.months

      // Apple takes a commission, so the in-app price sits above the web one.
      const iosPrice = Math.round(totalAmount * (1 + IOS_PRICE_UPLIFT))

      const link = buildCheckoutUrl(plan.planKey, c.cycle)
      const paymentLink = applyChatbotDiscount
        ? appendChatbotDiscountToCheckoutUrl(link)
        : link

      const out = {
        planKey: plan.planKey,
        title: plan.title,
        basePrice,
        gst,
        totalAmount,
        ios_price: iosPrice,
        duration: c.duration,
        listPrice,
        save: listPrice - basePrice,
        reels,
        ...(plan.popular ? { popular: true } : {}),
        features: [
          `${reels} Reels${c.cycle === "monthly" ? " per Month" : ""}`,
          ...(plan.staticFeatures || []),
        ],
        description: plan.description || "",
        paymentLink,
        planLink: paymentLink,
        purchaseLink: paymentLink,
      }

      if (!applyChatbotDiscount) return out

      // Chatbot quote: discount the price, then restore the iOS figure, which
      // applyChatbotDiscountToPlan would otherwise overwrite with the
      // discounted total.
      const discounted = applyChatbotDiscountToPlan(out)
      return { ...discounted, ios_price: iosPrice }
    }),
  }))

  return { currency: "INR", gstRate: GST_RATE, billingCycles }
}
