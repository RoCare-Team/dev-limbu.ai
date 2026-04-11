"use client";

import { lazy, Suspense, useEffect, useState } from "react";

// ── Eagerly loaded — above the fold, critical for LCP ──
import HeaderSection from "../components/sections/HeaderSection";
import HeroSection from "../components/sections/HeroSection";

// ── Icons — always eager (tiny, no split needed) ──
import { Clock, MessageSquare, PenTool, Star } from "lucide-react";
// import SEOSection from "@/components/sections/SEOSection";

// ── Lazily loaded sections ──
const ExamplesSection = lazy(
  () => import("../components/sections/ExamplesSection"),
);
const VideoExamplesSection = lazy(
  () => import("../components/sections/VideoExamplesSection"),
);
const StatsSection = lazy(() => import("@/components/sections/StatsSection"));
const VideoTestimonialSection = lazy(
  () => import("../components/sections/VideoTestimonialSection"),
);
const FeaturesSection = lazy(
  () => import("../components/sections/FeaturesSection"),
);

const ClientGrowthSection = lazy(
  () => import("../components/sections/ClientGrowthSection"),
);
const BusinessTypesSection = lazy(
  () => import("../components/sections/BusinessTypesSection"),
);
const CaseStudySection = lazy(
  () => import("../components/sections/CaseStudySection"),
);

// const ServicesSection = lazy(
//   () => import("../components/sections/ServicesSection"),
// );
// const SubscriptionSection = lazy(
//   () => import("../components/sections/SubscriptionSection"),
// );
// const WebDevelopmentSection = lazy(
//   () => import("../components/sections/WebDevelopmentSection"),
// );
// const AccountSetupSection = lazy(
//   () => import("../components/sections/AccountSetupSection"),
// );
const AppDownloadSection = lazy(
  () => import("../components/sections/AppDownloadSection"),
);
const ComparisonSection = lazy(
  () => import("../components/sections/ComparisonSection"),
);
const FAQSection = lazy(() => import("../components/sections/FAQSection"));
const FooterSection = lazy(
  () => import("../components/sections/FooterSection"),
);

// ── Lazily loaded modals ──
const SignupPopup = lazy(() => import("../components/modals/SignupPopup"));
const VideoModal = lazy(() => import("../components/modals/VideoModal"));
const ServiceBookingModal = lazy(
  () => import("../components/modals/ServiceBookingModal"),
);
const BookDemoModal = lazy(() => import("@/components/modals/WebinarBooking"));
const ImageModal = lazy(() => import("@/components/modals/ImageModal"));

// ── UI utilities ──
const ScrollToTop = lazy(() => import("@/components/ui/ScrollToTop"));

// ── Skeleton shown while a section's JS chunk loads ──
function SectionSkeleton() {
  return (
    <div
      className="w-full py-24 flex items-center justify-center"
      style={{ backgroundColor: "var(--cyber-black)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-7 h-7 rounded-full animate-pulse"
          style={{
            background: "rgba(253,224,71,0.12)",
            border: "1px solid rgba(253,224,71,0.25)",
          }}
        />
        <div
          className="h-px w-20 animate-pulse"
          style={{ background: "rgba(253,224,71,0.15)" }}
        />
      </div>
    </div>
  );
}

export default function LimbuAILanding() {
  // =============================
  // 🔵 STATES
  // =============================

  const [selectedImage, setSelectedImage] = useState(null);

  const [showSignupPopup, setShowSignupPopup] = useState(false);

  const [showServiceModal, setShowServiceModal] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
  // 🟣 EFFECTS
  // =============================

  useEffect(() => {
    const loadRazorpay = async () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignupPopup(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
        setShowServiceModal(false);
        setShowSignupPopup(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // =============================
  // 🟢 HANDLERS
  // =============================

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  const handleServiceBookClick = (plan) => {
    setSelectedPlan(plan);
    setShowServiceModal(true);
  };

  const handleServicePayment = async (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.phone || !serviceForm.email) {
      showToast("Please fill in all fields", "error");
      return;
    }

    // const res = await loadRazorpayScript();
    // if (!res) {
    //   showToast("Razorpay SDK failed to load. Are you online?", "error");
    //   return;
    // }

    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    try {
      const amountVal =
        typeof selectedPlan.totalPrice === "string"
          ? parseInt(selectedPlan.totalPrice.replace(/[^\d]/g, ""))
          : selectedPlan.totalPrice;

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.title,
          amount: amountVal,
          receipt: `receipt_${Date.now()}`,
          notes: {
            plan_name: selectedPlan.title,
            user_email: serviceForm.email,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (orderData.error) {
        showToast("Error creating payment order", "error");
        return;
      }

      // 2. Open Razorpay
      const options = {
        key: process.env.RAZORPAY_KEY_ID || "rzp_live_RwW59lDH6d9dB8",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Limbu.ai",
        description: selectedPlan.title,
        image: "",
        order_id: orderData.order.id,
        handler: async function (response) {
          // 3. Save Booking on Success
          try {
            const saveRes = await fetch("/api/service-booking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...serviceForm,
                planTitle: selectedPlan.title,
                planType: selectedPlan.planType,
                planDuration: selectedPlan.planDuration,
                planPrice: selectedPlan.price,
                totalAmount: selectedPlan.totalPrice,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                status: "paid",
              }),
            });

            if (saveRes.ok) {
              setBookingSuccess(true);
              setServiceForm({ name: "", phone: "", email: "", gstNumber: "" });
              showToast("Payment Successful!", "success");
            } else {
              showToast(
                "Payment successful but failed to save booking.",
                "warning",
              );
            }
          } catch (err) {
            console.error(err);
            showToast("Error saving booking", "error");
          }
        },
        prefill: {
          name: serviceForm.name,
          email: serviceForm.email,
          contact: serviceForm.phone,
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  const accountSetupPlans = [
    {
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
  ];

  const subscriptionPlans = [
    {
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
  ];

  const webDevelopmentPlans = [
    {
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
      ],
      description: "Perfect for small websites starting SEO",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
    },
    {
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
  ];

  const handleSubscriptionClick = (plan) => {
    const multiplier = getMultiplier();
    const price = calculatePrice(plan.basePrice);
    const gst = Math.round(price * 0.18);
    const total = price + gst;

    const dynamicFeatures = [
      `${plan.basePosts * multiplier} GMB Posts`,
      `${plan.baseCitations * multiplier} Citations`,
      ...plan.staticFeatures,
    ];

    handleServiceBookClick({
      title: plan.title,
      planType: "our-package",
      planDuration: billingCycle,
      price: `₹${price.toLocaleString()}`,
      period:
        billingCycle === "monthly"
          ? "/ month"
          : billingCycle === "quarterly"
            ? "/ quarter"
            : billingCycle === "half-yearly"
              ? "/ 6 months"
              : "/ year",
      gstAmount: `₹${gst.toLocaleString()}`,
      totalPrice: `₹${total.toLocaleString()}`,
      subtitle: plan.description,
      features: dynamicFeatures,
      tag: plan.description,
      buttonColor: plan.color,
    });
  };

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

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setBookingSuccess(false);
    setShowServiceModal(true);
  };

  // =============================
  // 🟡 DUMMY DATA (Replace With Real)
  // =============================

  const videoExamples = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.11+PM.mp4",
    // "https://res.cloudinary.com/dwrbpboxy/video/upload/v1766144309/WhatsApp_Video_2025-12-19_at_5.03.45_PM_ryvxhc.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM+(2).mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765573/WhatsApp_Video_2026-01-07_at_11.24.14_AM_j6ck8w.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765583/WhatsApp_Video_2026-01-07_at_11.25.30_AM_adbkxc.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765586/WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4",
  ];

  const postImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764404571/tmpx28dvfi__qxwt1c.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1768026391/LED_BOARD_MAKER_NEAR_ME_IN_VAISHALI_NAGAR_pethuq.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767776297/output_yd9alt.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1768033881/Post_banana_Main_Ek_ka_ladiss_ka_makeup_Karta_Hai_HD_picture_send_karo_vp6d6s.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767973055/Nutritionvalue_21_on_google_m2etix.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767694542/output_n1ahcx.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767961910/output_ryar6j.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764238151/tmp9x2d_a52_hvhpw8.jpg",
  ];

  const features = [
    {
      icon: PenTool,
      title: "AI Post Generation",
      description: "Create engaging GMB posts instantly with AI assistance",
      color: "from-neutral-500 to-neutral-600",
      link: "/post-management",
    },
    {
      icon: Clock,
      title: "Free Website Builder",
      description: "Build a professional website with our AI-powered builder",
      color: "from-neutral-500 to-neutral-600",
      link: "/build-website",
    },
    {
      icon: MessageSquare,
      title: "Review Management",
      description: "Respond to reviews with AI-powered suggestions",
      color: "from-neutral-500 to-neutral-600",
      link: "/review-management",
    },
    {
      icon: Star,
      title: "Magic QR",
      description: "Filter negative reviews with smart QR technology",
      color: "from-neutral-500 to-neutral-600",
      link: "/get-magic-qr",
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
        "Minor corrections (name, address consistency)",
        "1 month  support assistance",
      ],
      tag: (
        <>
          Best for: Businesses that already have a GMB listing and need basic
          updates <br /> or fixes.
        </>
      ),
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
  ];

  // =============================
  // 🔴 UI
  // =============================

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50">
      <HeaderSection />

      <HeroSection
        videoExamples={videoExamples}
        handleNavigation={handleNavigation}
        isLoggedIn={isLoggedIn}
      />

      <Suspense fallback={<SectionSkeleton />}>
        <StatsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BusinessTypesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <VideoTestimonialSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <ExamplesSection
          postImages={postImages}
          setSelectedImage={setSelectedImage}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <VideoExamplesSection videoExamples={videoExamples} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection features={features} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <ClientGrowthSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CaseStudySection />
      </Suspense>

      {/* <Suspense fallback={<SectionSkeleton />}>
        <ServicesSection
          servicePlans={servicePlans}
          handleServiceBookClick={handleServiceBookClick}
        />
      </Suspense> */}
      {/* <Suspense fallback={<SectionSkeleton />}>
        <SubscriptionSection
          subscriptionPlans={subscriptionPlans}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          calculatePrice={calculatePrice}
          getMultiplier={getMultiplier}
          handleSubscriptionClick={handleSubscriptionClick}
        />
      </Suspense> */}

      {/* <Suspense fallback={<SectionSkeleton />}>
        <WebDevelopmentSection
          webPlans={webDevelopmentPlans}
          handlePlanClick={handlePlanClick}
        />
      </Suspense> */}

      {/* <Suspense fallback={<SectionSkeleton />}>
        <SEOSection seoPlans={seoPlans} handlePlanClick={handlePlanClick} />
      </Suspense> */}
      {/* <Suspense fallback={<SectionSkeleton />}>
        <AccountSetupSection
          plans={accountSetupPlans}
          handlePlanClick={handlePlanClick}
        />
      </Suspense> */}

      <div className="hidden md:block">
        <Suspense fallback={<SectionSkeleton />}>
          <AppDownloadSection />
        </Suspense>
      </div>

      <ComparisonSection />

      <Suspense fallback={<SectionSkeleton />}>
        <FAQSection />
      </Suspense>

      {/* MODALS */}
      <Suspense fallback={<SectionSkeleton />}>
        <SignupPopup
          showSignupPopup={showSignupPopup}
          setShowSignupPopup={setShowSignupPopup}
          isLoggedIn={isLoggedIn}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <ImageModal
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
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

      <Suspense fallback={<SectionSkeleton />}>
        <FooterSection handleNavigation={handleNavigation} />
      </Suspense>

      <ScrollToTop />

      <BookDemoModal />

      <VideoModal />
    </div>
  );
}
