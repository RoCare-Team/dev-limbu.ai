"use client";

import { lazy, Suspense, useEffect, useState } from "react";

// ── Eagerly loaded — critical for layout ──
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

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
  // ── Modal / booking state ──
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ── Auth state read from localStorage ──
  const [loggedInUser, setLoggedInUser] = useState(null); // { userId, fullName, email, phone, token }

  // ── Form state — only used when guest (not logged in) ──
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstNumber: "",
  });

  // ─────────────────────────────────────────────
  // Read localStorage once on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      const email =
        localStorage.getItem("userEmail") || localStorage.getItem("email");
      const name = localStorage.getItem("fullName");
      const phone = localStorage.getItem("mobileNumber");

      if (userId && token) {
        setLoggedInUser({ userId, token, email, name, phone });
      }
    } catch (_) {
      // localStorage not available (SSR guard)
    }
  }, []);

  // ─────────────────────────────────────────────
  // Plan data
  // ─────────────────────────────────────────────
  const subscriptionPlans = [
    {
      title: "Basic Plan",
      basePrice: 3500,
      totalAmount: 4130,
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
      title: "Premium Plan",
      basePrice: 7500,
      totalAmount: 8850,
      basePosts: 45,
      baseCitations: 20,
      staticFeatures: [
        "Review Reply Management",
        "Custom QR Code Generation",
        "Business Insights Dashboard",
        "Category Addition & Optimization",
        "Website Builder",
        "Professional Services Integration",
        "10 Agent Access",
        "WhatsApp Workflow Automation",
        "10 AI-Generated Reels per Month",
      ],
      description: "Perfect for brands focused on automation and maximum reach",
      popular: true,
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-neutral-200",
    },
    {
      title: "Professional Plan",
      basePrice: 5500,
      totalAmount: 6490,
      basePosts: 30,
      baseCitations: 12,
      staticFeatures: [
        "Review Reply Management",
        "Custom QR Code Generation",
        "Business Insights Dashboard",
        "Category Setup & Optimization",
        "Business Website Builder",
        "WhatsApp API Integration",
        "Multi-Agent Support (Up to 5 Agents)",
        "Data Scraper (1,000 Leads / Month)",
        "4 AI-Generated Reels per Month",
      ],
      description: "Best for growing businesses looking for better visibility",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-purple-200",
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

  const webDevelopmentPlans = [
    {
      title: "Starter Website",
      basePrice: 9999,
      basePages: 5,
      staticFeatures: [
        "Responsive Design",
        "Basic SEO Setup",
        "Contact Form",
        "Social Media",
        "1 Month Support",
      ],
      description: "Perfect for small businesses or startups",
    },
    {
      title: "Business Website",
      basePrice: 25000,
      basePages: 15,
      staticFeatures: [
        "Custom UI/UX Design",
        "Advanced SEO",
        "Admin Panel",
        "Google Analytics",
        "3 Months Support",
      ],
      popular: true,
      description: "Best for growing businesses",
    },
    {
      title: "Enterprise Website",
      basePrice: 48000,
      basePages: 35,
      staticFeatures: [
        "Fully Custom Design",
        "E-commerce Integration",
        "Payment Gateway",
        "Advanced Security",
        "6 Months Support",
      ],
      description: "Perfect for large businesses & brands",
    },
  ];

  const seoPlans = [
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
      color: "bg-neutral-700",
    },
  ];

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
  const calculatePrice = (basePrice) => {
    if (billingCycle === "monthly") return basePrice;
    if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.9);
    if (billingCycle === "half-yearly") return Math.round(basePrice * 6 * 0.85);
    if (billingCycle === "yearly") return Math.round(basePrice * 12 * 0.8);
    return basePrice;
  };

  const getMultiplier = () => {
    if (billingCycle === "quarterly") return 3;
    if (billingCycle === "half-yearly") return 6;
    if (billingCycle === "yearly") return 12;
    return 1;
  };

  // ─────────────────────────────────────────────
  // Open modal — set selected plan
  // ─────────────────────────────────────────────
  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setBookingSuccess(false);
    setShowServiceModal(true);
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
        `${plan.baseCitations * multiplier} Citations`,
        ...plan.staticFeatures,
      ],
    });
  };

  // ─────────────────────────────────────────────
  // Razorpay loader
  // ─────────────────────────────────────────────
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true); // already loaded
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ─────────────────────────────────────────────
  // Core: open Razorpay for a known userId
  // ─────────────────────────────────────────────
  const openRazorpay = async ({ userId, name, email, phone }) => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // Parse amount safely
    const rawTotal =
      selectedPlan?.totalPrice ??
      selectedPlan?.totalAmount ??
      selectedPlan?.basePrice ??
      0;
    const parsedAmount =
      typeof rawTotal === "string"
        ? Number(rawTotal.replace(/[^0-9.-]+/g, ""))
        : Number(rawTotal);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Invalid payment amount. Please contact support.");
      return;
    }

    // Create Razorpay order
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: selectedPlan?.title,
        amount: parsedAmount,
        receipt: `plan_${Date.now()}`,
        notes: { plan_name: selectedPlan?.title, user_email: email },
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData?.order) {
      alert(
        `Error: ${orderData?.error || "Payment gateway connection failed."}`,
      );
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "Limbu AI",
      description: `Payment for ${selectedPlan?.title}`,
      order_id: orderData.order.id,
      prefill: { name, email, contact: phone },
      theme: { color: "#eab308" },
      handler: async (response) => {
        try {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              plan: selectedPlan?.title,
              payment: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
            }),
          });

          if (verifyRes.ok) {
            setBookingSuccess(true);
            setTimeout(() => {
              setShowServiceModal(false);
              setBookingSuccess(false);
              setServiceForm({ name: "", phone: "", email: "", gstNumber: "" });
            }, 3000);
          } else {
            alert("Payment verification failed on server.");
          }
        } catch (err) {
          console.error("Verification Error:", err);
          alert(
            "Payment successful but verification failed. Please contact support.",
          );
        }
      },
    };

    new window.Razorpay(options).open();
  };

  // ─────────────────────────────────────────────
  // LOGGED-IN USER: skip form, pay directly
  // ─────────────────────────────────────────────
  const handleLoggedInPayment = async () => {
    if (!loggedInUser) return;
    await openRazorpay({
      userId: loggedInUser.userId,
      name: loggedInUser.name,
      email: loggedInUser.email,
      phone: loggedInUser.phone,
    });
  };

  const handleGuestPayment = async (e) => {
    e.preventDefault();

    try {
      const createRes = await fetch("/api/create-or-find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: serviceForm.name,
          email: serviceForm.email,
          phone: serviceForm.phone, // Matches Schema "phone"
          gstNumber: serviceForm.gstNumber,
          source: "website",
          planDuration: selectedPlan?.planDuration || "monthly",
        }),
      });

      const createData = await createRes.json();

      // Check for success and userId
      if (!createRes.ok || !createData?.userId) {
        alert(createData?.error || "Failed to process user information.");
        return;
      }

      // Use the userId from the response for Razorpay
      await openRazorpay({
        userId: createData.userId,
        name: serviceForm.name || createData.user?.fullName || "Guest",
        email: serviceForm.email || createData.user?.email,
        phone: serviceForm.phone || createData.user?.phone,
      });
    } catch (err) {
      console.error("Guest Payment Error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // ─────────────────────────────────────────────
  // Unified handler passed to ServiceBookingModal
  // ─────────────────────────────────────────────
  const handleServicePayment = loggedInUser
    ? handleLoggedInPayment
    : handleGuestPayment;

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
        <ServiceBookingModal
          showServiceModal={showServiceModal}
          setShowServiceModal={setShowServiceModal} 
          selectedPlan={selectedPlan}
          bookingSuccess={bookingSuccess}
          /* If logged in, form is hidden — pass null so modal knows */
          serviceForm={loggedInUser ? null : serviceForm}
          setServiceForm={loggedInUser ? null : setServiceForm}
          isLoggedIn={!!loggedInUser}
          loggedInUser={loggedInUser}
          handleServicePayment={handleServicePayment}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
    </div>
  );
}
