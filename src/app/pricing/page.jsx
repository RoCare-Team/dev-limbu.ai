"use client";

import { lazy, Suspense, useEffect, useState } from "react";

// ── Eagerly loaded — critical for layout ──
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

// ── Lazily loaded pricing sections ──
const SubscriptionSection = lazy(() => import("@/components/sections/SubscriptionSection"));
const ServicesSection = lazy(() => import("@/components/sections/ServicesSection"));
const WebDevelopmentSection = lazy(() => import("@/components/sections/WebDevelopmentSection"));
const SEOSection = lazy(() => import("@/components/sections/SeoPlans"));
const AccountSetupSection = lazy(() => import("@/components/sections/AccountSetupSection"));

// ── Lazily loaded modals ──
const ServiceBookingModal = lazy(() => import("@/components/modals/ServiceBookingModal"));
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
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstNumber: "",
  });

  // =============================
  // 🔵 DATA (Mirrored from page.js)
  // =============================

  const subscriptionPlans = [
    {
      title: "Basic Plan",
      basePrice: 2500,
      totalAmount: 2950,
      basePosts: 15,
      baseCitations: 5,
      staticFeatures: ["Review Reply System", "Magic Qr Code Generation", "Insights Dashboard", "Category Addition & Optimization", "Website Builder"],
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
      baseCitations: 15,
      staticFeatures: ["Review Reply Management", "Magic Qr Code Generation", "Insights Dashboard", "Category Addition & Optimization", "Website Builder", "Add Professional Services"],
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
      staticFeatures: ["Review Reply Management", "Magic Qr Code Generation", "Insights Dashboard", "Category Addition & Optimization", "website Builder"],
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
      features: ["Google Business Profile Functionality check", "Website URL update", "Mobile number update", "Basic profile verification check", "Minor corrections", "1 month support"],
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
      features: ["GMB creation from scratch", "Address verification guidance", "Category selection", "Product listing setup", "Service management", "Business optimization", "1-month support"],
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
      staticFeatures: ["Responsive Design", "Basic SEO Setup", "Contact Form", "Social Media", "1 Month Support"],
      description: "Perfect for small businesses or startups",
    },
    {
      title: "Business Website",
      basePrice: 25000,
      basePages: 15,
      staticFeatures: ["Custom UI/UX Design", "Advanced SEO", "Admin Panel", "Google Analytics", "3 Months Support"],
      popular: true,
      description: "Best for growing businesses",
    },
    {
      title: "Enterprise Website",
      basePrice: 48000,
      basePages: 35,
      staticFeatures: ["Fully Custom Design", "E-commerce Integration", "Payment Gateway", "Advanced Security", "6 Months Support"],
      description: "Perfect for large businesses & brands",
    },
  ];

  const seoPlans = [
    {
      title: "Basic SEO",
      basePrice: 5999,
      staticFeatures: ["Keyword Research", "Meta Tags Optimization", "Basic Technical SEO", "Monthly Report"],
      description: "Perfect for small websites starting SEO",
      color: "bg-neutral-500",
    },
    {
      title: "Standard SEO",
      basePrice: 9999,
      staticFeatures: ["Technical SEO Audit", "Backlink Building", "Competitor Analysis", "Bi-Weekly Reports"],
      popular: true,
      color: "bg-neutral-600",
    },
    {
      title: "Advanced SEO",
      basePrice: 15999,
      staticFeatures: ["Advanced 45-Page SEO", "Complete SEO Strategy", "High Quality Backlinks", "Technical Optimization", "Local SEO", "Weekly Report"],
      color: "bg-neutral-700",
    },
  ];

  const accountSetupPlans = [
    {
      title: "Google Ads Account Setup",
      basePrice: 2500,
      description: "Complete Google Ads setup with keywords, tracking, and analytics.",
      staticFeatures: ["Account creation", "Billing config", "Keyword research", "Negative keywords", "GA4 setup", "Conversion tracking"],
    },
    {
      title: "Meta Ads Account Setup",
      basePrice: 3500,
      popular: true,
      description: "Complete Meta (FB & IG) setup with audience research and pixel tracking.",
      staticFeatures: ["Business Manager setup", "Ad account config", "Audience research", "Pixel/CAPI setup", "Creative strategy", "Copywriting"],
    },
  ];

  // =============================
  // 🟢 HANDLERS
  // =============================

  const calculatePrice = (basePrice) => {
    if (billingCycle === "monthly") return basePrice;
    if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.9);
    if (billingCycle === "half-yearly") return Math.round(basePrice * 6 * 0.85);
    if (billingCycle === "yearly") return Math.round(basePrice * 12 * 0.8);
    return basePrice;
  };

  const getMultiplier = () => {
    if (billingCycle === "monthly") return 1;
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
      totalPrice: total,
      gstAmount: `₹${gst.toLocaleString()}`,
      subtitle: plan.description,
      features: [`${plan.basePosts * multiplier} GMB Posts`, `${plan.baseCitations * multiplier} Citations`, ...plan.staticFeatures],
    });
  };

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setBookingSuccess(false);
    setShowServiceModal(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleServicePayment = async (e) => {
    e.preventDefault();

    if (!serviceForm.name || !serviceForm.phone || !serviceForm.email) {
      alert("Please fill all required fields.");
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // Safely parse the amount, handling both string ("₹2,950") and number (8850)
    let parsedAmount = 0;
    if (selectedPlan) {
      const rawTotal = selectedPlan.totalPrice || selectedPlan.totalAmount || selectedPlan.basePrice;
      if (typeof rawTotal === 'string') {
        parsedAmount = Number(rawTotal.replace(/[^0-9.-]+/g, ""));
      } else {
        parsedAmount = Number(rawTotal);
      }
    }

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Invalid payment amount. Please contact support.");
      return;
    }

    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan?.title,
          amount: parsedAmount,
          receipt: `plan_${Date.now()}`,
          notes: {
            plan_name: selectedPlan?.title,
            user_email: serviceForm.email,
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData || !orderData.order) {
        console.error("Order creation failed:", { status: orderRes.status, data: orderData });
        alert(`Error: ${orderData?.error || "Payment gateway connection failed."}`);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Limbu AI",
        description: `Payment for ${selectedPlan?.title}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Here you would typically save the transaction to your database
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan?.title,
                amount: parsedAmount,
                userData: serviceForm
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
          } catch (error) {
            console.error("Verification Error:", error);
            alert("Payment successful but verification failed. Please contact support.");
          }
        },
        prefill: {
          name: serviceForm.name,
          email: serviceForm.email,
          contact: serviceForm.phone,
        },
        theme: {
          color: "#eab308",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to initiate payment.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <HeaderSection />

      {/* Hero-like Header for Pricing */}
      <div className="pt-32 pb-16 px-4 text-center bg-slate-50/50 border-b border-black/5">
        <h1
          className="font-black uppercase tracking-tight mb-6"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1rem, 4vw, 3.5rem)",
            lineHeight: "0.95"
          }}
        >
          Pricing of <span className="text-lemon-hover">Limbu AI</span>
        </h1>
        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Simple, transparent, and built for scale. Whether you&apos;re a single location or a global brand, we have a plan for your growth.
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
          <SEOSection
            seoPlans={seoPlans}
            handlePlanClick={handlePlanClick}
          />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <AccountSetupSection
            plans={accountSetupPlans}
            handlePlanClick={handlePlanClick}
          />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <FooterSection />
      </Suspense>

      {/* MODALS */}
      <Suspense fallback={null}>
        <ServiceBookingModal
          showServiceModal={showServiceModal}
          setShowServiceModal={setShowServiceModal}
          selectedPlan={selectedPlan}
          bookingSuccess={bookingSuccess}
          serviceForm={serviceForm}
          setServiceForm={setServiceForm}
          handleServicePayment={handleServicePayment}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
    </div>
  );
}
