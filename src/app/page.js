
"use client"

import { useState, useEffect } from "react"

import HeaderSection from "../components/sections/HeaderSection"
import HeroSection from "../components/sections/HeroSection"
import ClientLogosSection from "../components/sections/ClientLogosSection"
import ExamplesSection from "../components/sections/ExamplesSection"
import VideoExamplesSection from "../components/sections/VideoExamplesSection"
import FeaturesSection from "../components/sections/FeaturesSection"
import AccountSetupSection from "../components/sections/AccountSetupSection"
import ServicesSection from "../components/sections/ServicesSection"
import SeoPlans from "../components/sections/SeoPlans"
import SubscriptionSection from "../components/sections/SubscriptionSection"
import WebDevelopmentSection from "../components/sections/WebDevelopmentSection"
import SEOSection from "../components/sections/SEOSection"
import ComparisonSection from "../components/sections/ComparisonSection"
import TestimonialsSection from "../components/sections/TestimonialsSection"
import FAQSection from "../components/sections/FAQSection"
import FooterSection from "../components/sections/FooterSection"


import SignupPopup from "../components/modals/SignupPopup"
import VideoModal from "../components/modals/VideoModal"
import BookDemoModal from "../components/modals/BookDemoModal"
import ImageModal from "../components/modals/ImageModal"
import ServiceBookingModal from "../components/modals/ServiceBookingModal"
import AnupGuptaLogo from "../../public/images/clients/anup_gupta.png";
import DynamicDrapryLogo from "../../public/images/clients/dynamic_drapry.png";
import BanjaraSalonLogo from "../../public/images/clients/banjara_salon.png";
import MazzLogo from "../../public/images/clients/mazz.png";
import LuckyDryLogo from "../../public/images/clients/lucky_dry.jpg";
import GudiyaCollectionLogo from "../../public/images/clients/gudiya_collection.png";
import MannubhaiLogo from "../../public/images/clients/mannubhai.webp";
import RoCareIndiaLogo from "../../public/images/clients/ro-care-india.webp";
import DoctorFresh from "../../public/images/clients/doctor-fresh.webp";
import { Clock, MessageSquare, PenTool, Star } from "lucide-react"
// import Toast from '../components/Toast';


// import Toast from '../components/Toast';

// const MobileAppBanner = () => (
// <section className="mt-10 px-4 sm:px-6 mb-4">
// <div className="max-w-7xl mx-auto rounded-3xl bg-white shadow-xl overflow-hidden border border-slate-200">
//         <div className="flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 py-10 gap-10">

//           {/* LEFT CONTENT */}
//           <div className="max-w-xl text-center lg:text-left">

//             {/* Logo + Brand */}
//             <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
//               <Image src={LogoImage} alt="Limbu.ai" className="w-10 h-10" />
//               <span className="text-lg font-semibold text-slate-700">
//                 Limbu.ai
//               </span>
//             </div>

//             <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight">
//               Manage Your Business the Smart Way
//             </h2>

//             <p className="mt-3 text-slate-600 text-base">
//               Ek hi app se manage karein{" "}
//               <span className="font-semibold text-slate-800">
//                 Google Business Profile, Instagram aur Facebook
//               </span>{" "}
//               — posts, reviews, leads aur customer messages.
//             </p>

//             {/* FEATURES */}
//             <div className="mt-5 space-y-2 text-slate-700 text-sm">
//               <div className="flex items-center gap-2 justify-center lg:justify-start">
//                 <CheckCircle className="w-4 h-4 text-green-600" />
//                 Create & schedule social media posts easily
//               </div>
//               <div className="flex items-center gap-2 justify-center lg:justify-start">
//                 <CheckCircle className="w-4 h-4 text-green-600" />
//                 Manage Google reviews & customer chats
//               </div>
//               <div className="flex items-center gap-2 justify-center lg:justify-start">
//                 <CheckCircle className="w-4 h-4 text-green-600" />
//                 Simple dashboard – no technical skills required
//               </div>
//             </div>
//           </div>

//           {/* RIGHT OFFER CARD */}
//           <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center max-w-sm w-full">
//             <p className="text-sm text-slate-500">Limited Time Offer</p>

//             <h3 className="text-3xl font-bold text-slate-800 mt-2">
//               🎁 500 FREE Coins
//             </h3>

//             <p className="text-slate-600 text-sm mt-2">
//               Download the Limbu.ai app and get bonus coins instantly
//             </p>

//             <a
//               href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="mt-5 inline-flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
//             >
//               <Download className="w-5 h-5" />
//               Download App Now
//             </a>

//             <img
//               src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
//               alt="Get it on Google Play"
//               className="h-12 mx-auto mt-4"
//             />
//           </div>

//         </div>
//       </div>
//     </section>
// );

export default function LimbuAILanding() {

  // =============================
  // 🔵 STATES
  // =============================

  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)

  const [showSignupPopup, setShowSignupPopup] = useState(false)
  const [showBookDemoModal, setShowBookDemoModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
 const [showVideoModal, setShowVideoModal] = useState(false)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billingCycle, setBillingCycle] = useState("monthly")

  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const [demoDetails, setDemoDetails] = useState({
    name: "",
    contact: "",
    selectedDate: new Date()
  })

  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false)
  const [demoBooked, setDemoBooked] = useState(false)

  const [bookingSuccess, setBookingSuccess] = useState(false)

  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstNumber: ""
  })

  
  // =============================
  // 🟣 EFFECTS
  // =============================

  useEffect(() => {
  const loadRazorpay = async () => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
  }
  loadRazorpay()
}, [])


  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignupPopup(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null)
        setSelectedVideo(null)
        setShowBookDemoModal(false)
        setShowServiceModal(false)
        setShowSignupPopup(false)
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  // =============================
  // 🟢 HANDLERS
  // =============================

  const handleNavigation = (path) => {
    window.location.href = path
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  const handleServiceBookClick = (plan) => {
    setSelectedPlan(plan)
    setShowServiceModal(true)
  }

   const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
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
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

    try {
      const amountVal = typeof selectedPlan.totalPrice === "string"
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
            user_email: serviceForm.email
          }
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
                status: "paid"
              }),
            });

            if (saveRes.ok) {
              setBookingSuccess(true);
              setServiceForm({ name: '', phone: '', email: '', gstNumber: '' });
              showToast("Payment Successful!", "success");
            } else {
              showToast("Payment successful but failed to save booking.", "warning");
            }
          } catch (err) {
            console.error(err);
            showToast("Error saving booking", "error");
          }
        },
        prefill: {
          name: serviceForm.name,
          email: serviceForm.email,
          contact: serviceForm.phone
        },
        theme: {
          color: "#3B82F6"
        }
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
    title: "Google Account Setup",
    basePrice: 2500,
    description: "New Google Ads account creation",
    staticFeatures: [
      "Billing & payment setup",
      "Linking with Google Business Profile (if available)",
      "Linking with Google Analytics & Google Tag Manager",
      "Conversion Tracking Setup",
      "Website conversion tracking (form submissions, calls, purchases, etc.)",
      "Google Tag Manager setup (if required)",
      "Google Analytics 4 configuration",
      "Call tracking setup",
      "Event tracking configuration",
     
     
    ]
  },
  {
    title: "Meta Ad Account Setup",
    basePrice: 3500,
    popular: true,
    description: "Audience reaserch",
    staticFeatures: [
      "Offer positioning",
      "Campaign Setup Business Manager setup/verification",
      "Pixel setup & tracking configuration",
      "Conversion API integration (if required)",
      "Custom audience creation",
      "Lookalike audience setup",
      " Ad CreationCreative direction strategy",
      "Ad copywriting (high-converting scripts)",
      "Hook-based creatives",
      "A/B testing variations",
      "CTA optimization"
    ]
  }
]

  const subscriptionPlans = [
    {
      title: "Basic Plan",
      basePrice: 999,
      totalAmount: 1179,
      basePosts: 5,
      baseCitations: 2,
      staticFeatures: ["Review Reply Management","Magic Qr Code Generation","Insights Dashboard"],
      description: "Ideal for small businesses needing basic online presence",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-blue-200"
    },
       {
      title: "Premium Plan",
      basePrice: 5000,
      totalAmount: 5900,
      basePosts: 30,
      baseCitations: 12,
      staticFeatures: ["Review Reply System","Magic Qr Code Generation","Insights Dashboard","Category Addition & Optimization","Add Professional Service"],
      description: "Perfect for brands focused on automation and maximum reach",
      popular: true,
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-neutral-200"
    },
    {
      title: "Professional Plan",
      basePrice: 2500,
      totalAmount: 2950,
      basePosts: 15,
      baseCitations: 5,
      staticFeatures: ["Review Reply Management", "Magic Qr Code Generation","Insights Dashboard", "Category Addition & Optimization"],
      description: "Best for growing businesses looking for better visibility",
      color: "bg-neutral-600",
      textColor: "text-neutral-600",
      borderColor: "border-purple-200"
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
      "1 Month Free Support"
    ],
    description: "Perfect for small businesses or startups",
    color: "bg-neutral-600",
    textColor: "text-neutral-600"
  },
  {
    title: "Business Website",
    basePrice: 25000,
    basePages: 10,
    staticFeatures: [
      "Custom UI/UX Design",
      "Advanced SEO Optimization",
      "Admin Panel Access",
      "Google Analytics Integration",
      "3 Months Free Support"
    ],
    description: "Best for growing businesses",
    popular: true,
    color: "bg-neutral-600",
    textColor: "text-neutral-600"
  },
  {
    title: "Enterprise Website",
    basePrice: 48000,
    basePages: 20,
    staticFeatures: [
      "Fully Custom Design",
      "E-commerce Integration",
      "Payment Gateway Setup",
      "Advanced Security",
      "6 Months Free Support"
    ],
    description: "Perfect for large businesses & brands",
    color: "bg-neutral-600",
    textColor: "text-neutral-600"
  }
]

const seoPlans = [
  {
    title: "Basic SEO",
    basePrice: 5999,
    staticFeatures: [
      "10-Page SEO Optimization",
      "Keyword Research",
      "Meta Tags Optimization",
      "Basic Technical SEO",
      "Monthly Report"
    ],
    description: "Perfect for small websites starting SEO",
    color: "bg-neutral-600",
    textColor: "text-neutral-600"
  },
  {
    title: "Standard SEO",
    basePrice: 9999,
    staticFeatures: [
      "Advanced 25-Page SEO",
      "Technical SEO Audit",
      "Backlink Building",
      "Competitor Analysis",
      "Bi-Weekly Reports"
    ],
    description: "Best for growing businesses",
    popular: true,
    color: "bg-neutral-600",
    textColor: "text-neutral-600"
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
      "Weekly Performance Report"
    ],
    description: "Perfect for brands aiming for top ranking",
    color: "bg-neutral-600",
    textColor: "text-neutral-600"
  }
]




  const handleSubscriptionClick = (plan) => {
    const multiplier = getMultiplier();
    const price = calculatePrice(plan.basePrice);
    const gst = Math.round(price * 0.18);
    const total = price + gst;
    
    const dynamicFeatures = [
      `${plan.basePosts * multiplier} GMB Posts`,
      `${plan.baseCitations * multiplier} Citations`,
      ...plan.staticFeatures
    ];

    handleServiceBookClick({
        title: plan.title,
        planType: "our-package",
        planDuration: billingCycle,
        price: `₹${price.toLocaleString()}`,
        period: billingCycle === 'monthly' ? '/ month' : 
                 billingCycle === 'quarterly' ? '/ quarter' :
                 billingCycle === 'half-yearly' ? '/ 6 months' : '/ year',
        gstAmount: `₹${gst.toLocaleString()}`,
        totalPrice: `₹${total.toLocaleString()}`,
        subtitle: plan.description,
        features: dynamicFeatures,
        tag: plan.description,
        buttonColor: plan.color
    });
  };


  const calculatePrice = (basePrice) => {
    if (billingCycle === "monthly") return basePrice
    if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.9)
    if (billingCycle === "half-yearly") return Math.round(basePrice * 6 * 0.85)
    if (billingCycle === "yearly") return Math.round(basePrice * 12 * 0.8)
    return basePrice
  }

  const getMultiplier = () => {
    if (billingCycle === "monthly") return 1
    if (billingCycle === "quarterly") return 3
    if (billingCycle === "half-yearly") return 6
    if (billingCycle === "yearly") return 12
    return 1
  }

  
  const handleDemoInputChange = (e) => {
    const { name, value } = e.target
    setDemoDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlanClick = (plan) => {
  setSelectedPlan(plan)
  setBookingSuccess(false)
  setShowServiceModal(true)
}

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
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765586/WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4"
  ]
  const clientLogos = [
        // NOTE: Add your client logos in public/images/clients/
    { name: "Client 1", src: AnupGuptaLogo },
    { name: "Ro-Care India", src: RoCareIndiaLogo },
    { name: "Client 2", src: DynamicDrapryLogo },
    { name: "Mannubhai", src: MannubhaiLogo },
    { name: "Client 3", src: BanjaraSalonLogo },
    { name: "Client 4", src: MazzLogo },
    { name: "Client 6", src: GudiyaCollectionLogo },
    { name: "Client 5", src: LuckyDryLogo },
  ]
  const postImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764404571/tmpx28dvfi__qxwt1c.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1768026391/LED_BOARD_MAKER_NEAR_ME_IN_VAISHALI_NAGAR_pethuq.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767776297/output_yd9alt.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1768033881/Post_banana_Main_Ek_ka_ladiss_ka_makeup_Karta_Hai_HD_picture_send_karo_vp6d6s.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767973055/Nutritionvalue_21_on_google_m2etix.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767694542/output_n1ahcx.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767961910/output_ryar6j.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764238151/tmp9x2d_a52_hvhpw8.jpg"]

  const features = [
    {
      icon: PenTool,
      title: "AI Post Generation",
      description: "Create engaging GMB posts instantly with AI assistance",
      color: "from-neutral-500 to-neutral-600",
      link: "/post-management"
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "Auto-schedule posts at optimal times for maximum reach",
      color: "from-neutral-500 to-neutral-600",
      link: "/post-management"
    },
    {
      icon: MessageSquare,
      title: "Review Management",
      description: "Respond to reviews with AI-powered suggestions",
      color: "from-neutral-500 to-neutral-600",
      link: "/review-management"
    },
    {
      icon: Star,
      title: "Magic QR",
      description: "Filter negative reviews with smart QR technology",
      color: "from-neutral-500 to-neutral-600",
      link: "/get-magic-qr"
    }
  ]
  const servicePlans = [
    {
      title: "Physical Magic QR Code",
      planType: "our-service",
      planDuration: "one-time",
      price: "₹200",
      period: "+ 18% GST",
      totalPrice: "₹236",
      gstAmount: "₹36",
      subtitle: "Get a physical QR code delivered to your doorstep",
      features: [
        "Durable, high-quality print",
        "Weather-resistant material",
        "Helps in getting more positive reviews"
      ],
      tag: "Best for: Offline businesses wanting to boost online reviews.",
      iconColor: "text-green-500",
      buttonColor: "bg-neutral-600"
    },
    {
      title: "GMB Assistance & Update Plan",
      planType: "our-service",
      planDuration: "1 Month",
      price: "₹999",
      period: "+ 18% GST",
      totalPrice: "₹1,179",
      gstAmount: "₹180",
      subtitle: "Ideal for existing Google Business Profiles",
      features: [
        "Google Business Profile functionality check",
        "Website URL update",
        "Mobile number update",
        "Basic profile verification check",
        "Minor corrections (name, address consistency)",
        "1 month  support assistance"
      ],
      tag: "Best for: Businesses that already have a GMB listing and need basic updates or fixes.",
      iconColor: "text-blue-500",
      buttonColor: "bg-neutral-600"
    },
    {
      title: "GMB Creation & Management Plan (From Scratch)",
      planType: "our-service",
      planDuration: "1 Month",
      price: "₹2,500",
      period: "+ 18% GST",
      totalPrice: "₹2,950",
      gstAmount: "₹450",
      subtitle: "Ideal for new businesses or those without GMB",
      features: [
        "Google Business Profile creation from scratch",
        "Business address setup & verification guidance",
        "Category selection (primary & secondary)",
        "Product listing setup",
        "Service listing & management",
        "Business details optimization",
        "1-month complete assistance & support"
      ],
      tag: "Best for: New businesses or those without GMB",
      iconColor: "text-neutral-500",
      buttonColor: "bg-neutral-600"
    },
  ]
  // const subscriptionPlans = []
  const testimonials = []

  // =============================
  // 🔴 UI
  // =============================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">

      <HeaderSection
        isLoggedIn={isLoggedIn}
        handleNavigation={handleNavigation}
        handleLogout={handleLogout}
        setShowBookDemoModal={setShowBookDemoModal}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <HeroSection
        videoExamples={videoExamples}
        handleNavigation={handleNavigation}
        isLoggedIn={isLoggedIn}
        setShowVideoModal={setShowVideoModal}
      />

      {showVideoModal && (
  <div
    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    onClick={() => setShowVideoModal(false)}
  >
    <div
      className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl aspect-video"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setShowVideoModal(false)}
        className="absolute -top-4 -right-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg"
      >
        ✕
      </button>

      <iframe
        className="w-full h-full rounded-2xl"
        src="https://www.youtube.com/embed/eQUd6u36w3g?autoplay=1"
        title="YouTube video player"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
      ></iframe>
    </div>
  </div>
)}


      <ClientLogosSection clientLogos={clientLogos} />

      <ExamplesSection
        postImages={postImages}
        setSelectedImage={setSelectedImage}
      />

      <VideoExamplesSection
        videoExamples={videoExamples}
        setSelectedVideo={setSelectedVideo}
      />

      <FeaturesSection
        features={features}
        handleNavigation={handleNavigation}
      />

      <AccountSetupSection
  plans={accountSetupPlans}
  handlePlanClick={handlePlanClick}
/>

      <ServicesSection
        servicePlans={servicePlans}
        handleServiceBookClick={handleServiceBookClick}
      />

      <SubscriptionSection
        subscriptionPlans={subscriptionPlans}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        calculatePrice={calculatePrice}
        getMultiplier={getMultiplier}
        handleSubscriptionClick={handleSubscriptionClick}
      />

      <WebDevelopmentSection
  webPlans={webDevelopmentPlans}
  handlePlanClick={handlePlanClick}
/>

<SEOSection
  seoPlans={seoPlans}
  handlePlanClick={handlePlanClick}
/>
      <ComparisonSection />

      {/* <TestimonialsSection
        testimonials={testimonials}
        currentTestimonial={currentTestimonial}
        setCurrentTestimonial={setCurrentTestimonial}
      /> */}

      <FAQSection />


      {/* MODALS */}
      <SignupPopup
        showSignupPopup={showSignupPopup}
        setShowSignupPopup={setShowSignupPopup}
      />

      {showVideoModal && (
  <VideoModal
    setShowVideoModal={setShowVideoModal}
  />
)}


      <BookDemoModal
        showBookDemoModal={showBookDemoModal}
        setShowBookDemoModal={setShowBookDemoModal}
        demoDetails={demoDetails}
        setDemoDetails={setDemoDetails}
        // handleBookDemoSubmit={handleBookDemoSubmit}
        handleDemoInputChange={handleDemoInputChange}
        isSubmittingDemo={isSubmittingDemo}
        demoBooked={demoBooked}
      />

      <ImageModal
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />

    

      <ServiceBookingModal
        showServiceModal={showServiceModal}
        setShowServiceModal={setShowServiceModal}
        selectedPlan={selectedPlan}
        bookingSuccess={bookingSuccess}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        handleServicePayment={handleServicePayment}
      />

      <FooterSection handleNavigation={handleNavigation} />


    </div>
  )
}






