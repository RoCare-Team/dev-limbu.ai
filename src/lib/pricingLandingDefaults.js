import {
  appendCheckoutTestPlanToLanding,
  CHECKOUT_TEST_PLAN_KEY,
} from "./checkoutTestPlan"
import { getPublicSiteUrl } from "./siteUrl"
import {
  appendChatbotDiscountToCheckoutUrl,
  applyChatbotDiscountToPlan,
} from "./planCheckout"

/**
 * Merges CMS plan rows onto defaults by `planKey` so partial DB data never drops catalog items.
 * Same `planKey`: DB fields override defaults. Order follows defaults, then extra DB-only keys.
 */
export function mergePlanListWithDefaults(defaultList, dbList) {
  if (!Array.isArray(defaultList) || defaultList.length === 0) {
    return Array.isArray(dbList) ? dbList : []
  }
  if (!Array.isArray(dbList) || dbList.length === 0) {
    return defaultList
  }
  const map = new Map()
  for (const p of defaultList) {
    if (p?.planKey) map.set(p.planKey, { ...p })
  }
  for (const p of dbList) {
    if (!p?.planKey) continue
    const base = map.get(p.planKey) || {}
    map.set(p.planKey, { ...base, ...p })
  }
  const order = defaultList.map((p) => p?.planKey).filter(Boolean)
  const out = order.map((k) => map.get(k)).filter(Boolean)
  for (const k of map.keys()) {
    if (!order.includes(k)) out.push(map.get(k))
  }
  return out
}

/**
 * Default landing pricing catalog. Stored in Mongo as type `pricingLanding` via /api/home-data.
 * Each plan has planKey + purchaseLink (path `/checkout?planKey=...` — API expands to absolute URL).
 */
export const PRICING_LANDING_DEFAULTS = {
  sections: {
    subscription: {
      titlePrefix: "Our Package",
      titleHighlight: "Package",
      subtitle: "Choose the Package that suits your business needs",
    },
    service: {
      titlePrefix: "Our",
      titleHighlight: "Service Plans",
      subtitle: "Choose the perfect plan for your business growth",
    },
    web: {
      titlePrefix: "Our",
      titleHighlight: "Web Development",
      subtitle: "Choose the perfect website package for your business",
    },
    seo: {
      titlePrefix: "Our",
      titleHighlight: "SEO Plans",
      subtitle: "Improve your website ranking and online visibility",
    },
    accountSetup: {
      titlePrefix: "Professional",
      titleHighlight: "Account Setup Services",
      subtitle:
        "We provide professional Google & Meta account setup services.",
    },
  },

  subscriptionPlans: [
    {
      planKey: "subscription-basic",
      purchaseLink: "/checkout?planKey=subscription-basic",
      title: "Basic Plan",
      basePrice: 2500,
      totalAmount: 2950,
      basePosts: 15,
      baseCitations: 5,
      staticFeatures: [
        "Review Reply System",
        "Magic Qr Code Generation",
        "Insights Dashboard",
        "Category Addition & Optimization",
        "Website Builder",
      ],
      description: "Ideal for small businesses needing basic online presence",
      color: "bg-neutral-600",
      textColor: "text-dark",
      borderColor: "border-lightPrimary",
    },
    {
      planKey: "subscription-premium",
      purchaseLink: "/checkout?planKey=subscription-premium",
      title: "Premium Plan",
      basePrice: 7500,
      totalAmount: 8850,
      basePosts: 45,
      baseCitations: 15,
      staticFeatures: [
        "Review Reply Management",
        "Magic Qr Code Generation",
        "Insights Dashboard",
        "Category Addition & Optimization",
        "Website Builder",
        "Add Professional Services",
      ],
      description: "Perfect for brands focused on automation and maximum reach",
      popular: true,
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-neutral-200",
    },
    {
      planKey: "subscription-professional",
      purchaseLink: "/checkout?planKey=subscription-professional",
      title: "Professional Plan",
      basePrice: 5500,
      totalAmount: 6490,
      basePosts: 30,
      baseCitations: 12,
      staticFeatures: [
        "Review Reply Management",
        "Magic Qr Code Generation",
        "Insights Dashboard",
        "Category Addition & Optimization",
        "website Builder",
      ],
      description: "Best for growing businesses looking for better visibility",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-purple-200",
    },
  ],

  servicePlans: [
    {
      planKey: "service-gmb-assistance",
      purchaseLink: "/checkout?planKey=service-gmb-assistance",
      title: "GMB Assistance & Update Plan",
      planType: "our-service",
      planDuration: "1 Month",
      price: "₹2,500",
      period: "+ 18% GST",
      totalPrice: "₹2,950",
      gstAmount: "₹450",
      subtitle: "Ideal for existing Google Business Profiles",
      features: [
        "Google Business Profile Functionality check",
        "Website URL update",
        "Mobile number update",
        "Basic profile verification check",
        "Minor corrections (name, address consistency)",
        "1 month  support assistance",
      ],
      tag: "Best for: Businesses that already have a GMB listing and need basic updates or fixes.",
      iconColor: "text-blue-500",
      buttonColor: "bg-neutral-600",
    },
    {
      planKey: "service-gmb-creation",
      purchaseLink: "/checkout?planKey=service-gmb-creation",
      title: "GMB Creation & Management Plan (From Scratch)",
      planType: "our-service",
      planDuration: "1 Month",
      price: "₹3,000",
      period: "+ 18% GST",
      totalPrice: "₹3,540",
      gstAmount: "₹540",
      subtitle: "Ideal for new businesses or those without GMB",
      features: [
        "Google Business Profile creation from scratch",
        "Business address setup & verification guidance",
        "Category selection (primary & secondary)",
        "Product listing setup",
        "Service listing & management",
        "Business details optimization",
        "1-month complete assistance & support",
      ],
      tag: "Best for: New businesses or those without GMB",
      iconColor: "text-dark",
      buttonColor: "bg-lightPrimary",
    },
  ],

  webDevelopmentPlans: [
    {
      planKey: "web-starter",
      purchaseLink: "/checkout?planKey=web-starter",
      title: "Starter Website",
      basePrice: 9999,
      basePages: 5,
      staticFeatures: [
        "Responsive Website Design",
        "Basic SEO Setup",
        "Contact Form Integration",
        "Social Media Integration",
        "1 Month Free Support",
      ],
      description: "Perfect for small businesses or startups",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
    },
    {
      planKey: "web-business",
      purchaseLink: "/checkout?planKey=web-business",
      title: "Business Website",
      basePrice: 25000,
      basePages: 15,
      staticFeatures: [
        "Custom UI/UX Design",
        "Advanced SEO Optimization",
        "Admin Panel Access",
        "Google Analytics Integration",
        "3 Months Free Support",
      ],
      description: "Best for growing businesses",
      popular: true,
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
    },
    {
      planKey: "web-enterprise",
      purchaseLink: "/checkout?planKey=web-enterprise",
      title: "Enterprise Website",
      basePrice: 48000,
      basePages: 35,
      staticFeatures: [
        "Fully Custom Design",
        "E-commerce Integration",
        "Payment Gateway Setup",
        "Advanced Security",
        "6 Months Free Support",
      ],
      description: "Perfect for large businesses & brands",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
    },
  ],

  seoPlans: [
    {
      planKey: "seo-basic",
      purchaseLink: "/checkout?planKey=seo-basic",
      title: "Basic SEO",
      basePrice: 5999,
      staticFeatures: [
        "Keyword Research",
        "Meta Tags Optimization",
        "Basic Technical SEO",
        "Monthly Report",
      ],
      description: "Perfect for small websites starting SEO",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
    },
    {
      planKey: "seo-standard",
      purchaseLink: "/checkout?planKey=seo-standard",
      title: "Standard SEO",
      basePrice: 9999,
      staticFeatures: [
        "Technical SEO Audit",
        "Backlink Building",
        "Competitor Analysis",
        "Bi-Weekly Reports",
      ],
      description: "Best for growing businesses",
      popular: true,
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
    },
    {
      planKey: "seo-advanced",
      purchaseLink: "/checkout?planKey=seo-advanced",
      title: "Advanced SEO",
      basePrice: 15999,
      staticFeatures: [
        "Advanced 45-Page SEO",
        "Complete SEO Strategy",
        "High Quality Backlinks",
        "Technical Optimization",
        "Local SEO",
        "Weekly Performance Report",
      ],
      description: "Perfect for brands aiming for top ranking",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
    },
  ],

  accountSetupPlans: [
    {
      planKey: "account-google-ads",
      purchaseLink: "/checkout?planKey=account-google-ads",
      title: "Google Ads Account Setup",
      basePrice: 2500,
      description:
        "Complete Google Ads account setup with keyword research, tracking, and analytics integration.",
      staticFeatures: [
        "New Google Ads account creation",
        "Billing & payment configuration",
        "Search campaign keyword research",
        "High-intent keyword selection",
        "Negative keyword setup",
        "Competitor keyword analysis",
        "Campaign structure planning (Search / Display if required)",
        "Google Business Profile linking (if available)",
        "Google Analytics 4 (GA4) setup & configuration",
        "Google Tag Manager setup (if required)",
        "Conversion tracking setup",
        "Website conversion tracking (forms, calls, purchases, etc.)",
        "Event tracking configuration",
        "Call tracking setup",
      ],
    },
    {
      planKey: "account-meta-ads",
      purchaseLink: "/checkout?planKey=account-meta-ads",
      title: "Meta Ads Account Setup",
      basePrice: 3500,
      popular: true,
      description:
        "Complete Meta (Facebook & Instagram) ad account setup with audience research, tracking system, and creative strategy.",
      staticFeatures: [
        "Business Manager setup & verification",
        "Ad account creation & configuration",
        "Audience research & competitor analysis",
        "Interest-based targeting research",
        "Custom audience creation",
        "Lookalike audience setup",
        "Pixel setup & tracking configuration",
        "Conversion API integration (if required)",
        "Ad creative strategy & direction",
        "High-converting ad copywriting",
        "Hook-based creatives",
        "A/B testing variations",
        "CTA optimization setup",
      ],
    },
  ],
}

export function mergePricingLanding(doc) {
  const d = doc?.data !== undefined ? doc.data : doc
  const def = PRICING_LANDING_DEFAULTS
  if (!d || typeof d !== "object") {
    return { ...def, sections: { ...def.sections } }
  }

  const pickArr = (key) =>
    mergePlanListWithDefaults(def[key], Array.isArray(d[key]) ? d[key] : [])

  const mergeSection = (name) => ({
    ...def.sections[name],
    ...(d.sections?.[name] || {}),
  })

  return {
    subscriptionPlans: pickArr("subscriptionPlans"),
    servicePlans: pickArr("servicePlans"),
    webDevelopmentPlans: pickArr("webDevelopmentPlans"),
    seoPlans: pickArr("seoPlans"),
    accountSetupPlans: pickArr("accountSetupPlans"),
    sections: {
      subscription: mergeSection("subscription"),
      service: mergeSection("service"),
      web: mergeSection("web"),
      seo: mergeSection("seo"),
      accountSetup: mergeSection("accountSetup"),
    },
  }
}

const PLAN_ARRAY_KEYS = [
  "subscriptionPlans",
  "servicePlans",
  "webDevelopmentPlans",
  "seoPlans",
  "accountSetupPlans",
]

function toAbsolutePurchaseLink(plan) {
  const raw = (plan.purchaseLink ?? plan.purchselink ?? "").trim()
  const fallback = plan.planKey
    ? `/checkout?planKey=${encodeURIComponent(plan.planKey)}`
    : ""
  const pathOrUrl = raw || fallback
  if (!pathOrUrl) return ""
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl
  }
  const base = getPublicSiteUrl()
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`
  return `${base}${path}`
}

/**
 * Ensures each plan has absolute `purchaseLink` + `purchselink` + `paymentLink` (same value) for API/chatbot.
 * @param {{ applyChatbotPriceDiscount?: boolean }} [options]
 *   - `applyChatbotPriceDiscount` (default true): 10% off plan price only; GST recalculated at 18%.
 *     Set false for /checkout page load (discount applied once from URL `discount` param).
 */
export function expandPricingLandingForApi(merged, options = {}) {
  const applyChatbotPriceDiscount = options.applyChatbotPriceDiscount !== false
  if (!merged || typeof merged !== "object") return merged
  const mergedWithTest = appendCheckoutTestPlanToLanding(merged)
  const out = {
    ...mergedWithTest,
    sections: mergedWithTest.sections ? { ...mergedWithTest.sections } : {},
  }
  for (const key of PLAN_ARRAY_KEYS) {
    if (!Array.isArray(mergedWithTest[key])) continue
    out[key] = mergedWithTest[key].map((plan) => {
      if (!plan || typeof plan !== "object") return plan
      const priced = applyChatbotPriceDiscount
        ? applyChatbotDiscountToPlan(plan)
        : plan
      const abs = applyChatbotPriceDiscount
        ? appendChatbotDiscountToCheckoutUrl(toAbsolutePurchaseLink(priced))
        : toAbsolutePurchaseLink(priced)
      const withLinks = {
        ...priced,
        purchaseLink: abs,
        purchselink: abs,
        paymentLink: abs,
        planLink: abs,
      }
      if (withLinks.planKey === CHECKOUT_TEST_PLAN_KEY) {
        return { ...withLinks, listOnHomepage: false }
      }
      return withLinks
    })
  }
  if (out.servicePlans) {
    out.servicesPlans = out.servicePlans
  }
  return out
}
