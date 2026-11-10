"use client";

import { lazy, Suspense, useState } from "react";

// ── Eagerly loaded — critical for layout ──
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import { SEO_PLANS } from "@/lib/seoPlans";
import { WEB_DEVELOPMENT_PLANS } from "@/lib/webPlans";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";

// ── Lazily loaded pricing sections ──
const SubscriptionSection = lazy(
  () => import("@/components/sections/SubscriptionSection"),
);
const ServicesSection = lazy(
  () => import("@/components/sections/ServicesSection"),
);
const WebDevelopmentSection = lazy(
  () => import("@/components/sections/WebDevelopmentSection"),
);
const SEOSection = lazy(() => import("@/components/sections/SeoPlans"));
const SocialMediaSection = lazy(
  () => import("@/components/sections/SocialMediaSection"),
);
const AccountSetupSection = lazy(
  () => import("@/components/sections/AccountSetupSection"),
);

// ── Lazily loaded modals ──
const ServiceBookingModal = lazy(
  () => import("@/components/modals/ServiceBookingModal"),
);

const WhatsappPlansSection = lazy(
  () => import("@/components/sections/WhatsappPlansSection"),
);

const ScrollToTop = lazy(() => import("@/components/ui/ScrollToTop"));

// ── Skeleton ──
function SectionSkeleton() {
  return (
    <div className="w-full py-24 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full animate-pulse bg-yellow-400/20 border border-yellow-400/40" />
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("quarterly");
  // Booking modal + Razorpay checkout (shared with /website-development)
  const { handlePlanClick, modalProps } = usePlanCheckout();

  // ─────────────────────────────────────────────
  // Plan data
  // ─────────────────────────────────────────────
  const subscriptionPlans = [
    {
      title: "Basic Plan",
      basePrice: 2000,
      totalAmount: 2360,
      basePosts: 10,
      baseCitations: 0, // Basic has no citations — the line is hidden when 0
      staticFeatures: [
        "Review Reply System",
        "Magic Qr Code Generation",
        "Insights Dashboard",
        "Category Addition & Optimization",
      ],
      description: "Ideal for small businesses needing basic online presence",
      color: "bg-neutral-600",
      textColor: "text-dark",
      borderColor: "border-lightPrimary",
    },
    {
      title: "Professional Plan",
      basePrice: 3500,
      totalAmount: 4130,
      basePosts: 20,
      baseCitations: 5,
      staticFeatures: [
        "Review Reply Management",
        "Custom QR Code Generation",
        "Business Insights Dashboard",
        "Category Setup & Optimization",
      ],
      description: "Best for growing businesses looking for better visibility",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-purple-200",
    },
    {
      title: "Premium Plan",
      basePrice: 5500,
      totalAmount: 6490,
      basePosts: 30,
      baseCitations: 10,
      staticFeatures: [
        "Review Reply Management",
        "Custom QR Code Generation",
        "Business Insights Dashboard",
        "Category Addition & Optimization",
      ],
      description: "Perfect for brands focused on automation and maximum reach",
      popular: true,
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-neutral-200",
    },
  ];

  // Shared basics across every social media plan
  const SOCIAL_BASE_FEATURES = [
    "Reel Scripting & Editing",
    "Captions & Hashtags",
    "Post Insights / Analytics",
    "Comments Management",
    "DM Automation",
  ];

  // Social media reel plans — monthly rate; 10% off quarterly, 20% off yearly
  const socialMediaPlans = [
    {
      title: "Social Starter",
      basePrice: 3000,
      baseReels: 4,
      staticFeatures: SOCIAL_BASE_FEATURES,
      description: "For brands starting out on Instagram & Facebook",
    },
    {
      title: "Social Growth",
      basePrice: 6000,
      baseReels: 9,
      staticFeatures: SOCIAL_BASE_FEATURES,
      description: "For brands posting consistently every week",
      popular: true,
    },
    {
      title: "Social Pro",
      basePrice: 12000,
      baseReels: 20,
      staticFeatures: SOCIAL_BASE_FEATURES,
      description: "For brands that need daily short-form content",
    },
  ];

  const servicePlans = [
    {
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
        "Minor corrections",
        "1 month support",
      ],
      iconColor: "text-blue-500",
      buttonColor: "bg-neutral-600",
    },
    {
      title: "GMB Creation & Management Plan (From Scratch)",
      planType: "our-service",
      planDuration: "1 Month",
      price: "₹3,000",
      period: "+ 18% GST",
      totalPrice: "₹3,540",
      gstAmount: "₹540",
      subtitle: "Ideal for new businesses or those without GMB",
      features: [
        "GMB creation from scratch",
        "Address verification guidance",
        "Category selection",
        "Product listing setup",
        "Service management",
        "Business optimization",
        "1-month support",
      ],
      popular: true,
      iconColor: "text-dark",
      buttonColor: "bg-lightPrimary",
    },
  ];

  const webDevelopmentPlans = WEB_DEVELOPMENT_PLANS;

  const seoPlans = SEO_PLANS;

  const accountSetupPlans = [
    {
      title: "Google Ads Account Setup",
      basePrice: 2500,
      description:
        "Complete Google Ads setup with keywords, tracking, and analytics.",
      staticFeatures: [
        "Account creation",
        "Billing config",
        "Keyword research",
        "Negative keywords",
        "GA4 setup",
        "Conversion tracking",
      ],
    },
    {
      title: "Meta Ads Account Setup",
      basePrice: 3500,
      popular: true,
      description:
        "Complete Meta (FB & IG) setup with audience research and pixel tracking.",
      staticFeatures: [
        "Business Manager setup",
        "Ad account config",
        "Audience research",
        "Pixel/CAPI setup",
        "Creative strategy",
        "Copywriting",
      ],
    },
  ];

  const whatsappPlans = [
    {
      title: "Whatsapp Automation Plan",
      basePrice: 15000,
      totalAmount: 5899,
      description: "Complete WhatsApp automation solution for businesses",
      staticFeatures: [
        "Unlimited AI Agents ",
        "No Setup Cost",
        "No Markup Of Utility/Marketing Messages",
        "Flow Builder",
        "Lead Scrapper(500 Lead/month)",
        "Webhooks/Api",
      ],
      color: "bg-green-600",
      textColor: "text-green-600",
      borderColor: "border-green-200",
    },
  ];

  // ─────────────────────────────────────────────
  // Price helpers
  // ─────────────────────────────────────────────
  // GMB packages start at the quarterly cycle: 20% off quarterly, 50% off yearly.
  const calculatePrice = (basePrice) => {
    if (billingCycle === "monthly") return basePrice;
    if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.8);
    if (billingCycle === "half-yearly") return Math.round(basePrice * 6 * 0.85);
    if (billingCycle === "yearly") return Math.round(basePrice * 12 * 0.5);
    return basePrice;
  };

  const getMultiplier = () => {
    if (billingCycle === "quarterly") return 3;
    if (billingCycle === "half-yearly") return 6;
    if (billingCycle === "yearly") return 12;
    return 1;
  };

  const handleSubscriptionClick = (plan) => {
    const multiplier = getMultiplier();
    const price = calculatePrice(plan.basePrice);
    const gst = Math.round(price * 0.18);
    const total = price + gst;

    handlePlanClick({
      title: plan.title,
      planType: "our-package",
      planDuration: billingCycle,
      price: `₹${price.toLocaleString()}`,
      totalPrice: total, // always a number for payment
      gstAmount: `₹${gst.toLocaleString()}`,
      subtitle: plan.description,
      features: [
        `${plan.basePosts * multiplier} GMB Posts`,
        // Plans without citations (Basic) skip the line entirely
        ...(plan.baseCitations
          ? [`${plan.baseCitations * multiplier} Citations`]
          : []),
        ...plan.staticFeatures,
        // Social Media Management is an annual-only perk — unlocked only on the Yearly cycle, for all 3 plans
        ...(billingCycle === "yearly" ? ["Social Media Management"] : []),
      ],
    });
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <HeaderSection />

      {/* Hero header */}
      <div className="pt-32 pb-16 px-4 text-center bg-slate-50/50 border-b border-black/5">
        <h1
          className="font-black uppercase tracking-tight mb-6"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1rem, 4vw, 3.5rem)",
            lineHeight: "0.95",
          }}
        >
          Pricing of <span className="text-lemon-hover">Limbu AI</span>
        </h1>
        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Simple, transparent, and built for scale. Whether you&apos;re a single
          location or a global brand, we have a plan for your growth.
        </p>
      </div>

      <div className="space-y-0">
        <Suspense fallback={<SectionSkeleton />}>
          <SubscriptionSection
            subscriptionPlans={subscriptionPlans}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            calculatePrice={calculatePrice}
            getMultiplier={getMultiplier}
            handleSubscriptionClick={handleSubscriptionClick}
          />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <SocialMediaSection
            socialPlans={socialMediaPlans}
            handlePlanClick={handlePlanClick}
          />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <ServicesSection
            servicePlans={servicePlans}
            handleServiceBookClick={handlePlanClick}
          />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <WebDevelopmentSection
            webPlans={webDevelopmentPlans}
            handlePlanClick={handlePlanClick}
          />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <SEOSection seoPlans={seoPlans} handlePlanClick={handlePlanClick} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <AccountSetupSection
            plans={accountSetupPlans}
            handlePlanClick={handlePlanClick}
          />
        </Suspense>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <WhatsappPlansSection
          plans={whatsappPlans}
          handlePlanClick={handlePlanClick}
        />
      </Suspense>

      <Suspense fallback={null}>
        <FooterSection />
      </Suspense>

      {/* ── Booking / Payment Modal ── */}
      <Suspense fallback={null}>
        <ServiceBookingModal {...modalProps} />
      </Suspense>

      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
    </div>
  );
}
