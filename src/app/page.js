"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, MessageSquare, Calendar, ArrowRight, Star, TrendingUp, Shield, CheckCircle, PenTool, Clock, X, LogIn, Link2, LayoutGrid, Menu, ChevronRight, ChevronLeft, Gift, Video, Facebook, Instagram, Youtube, Linkedin, Phone, Download } from 'lucide-react';
import LogoImage from "../../public/images/bg-logo.png"
import Image from 'next/image';
import Toast from '../components/Toast';
import SupportModal from '../components/SupportModal';
import AnupGuptaLogo from "../../public/images/clients/anup_gupta.png";
import DynamicDrapryLogo from "../../public/images/clients/dynamic_drapry.png";
import BanjaraSalonLogo from "../../public/images/clients/banjara_salon.png";
import MazzLogo from "../../public/images/clients/mazz.png";
import LuckyDryLogo from "../../public/images/clients/lucky_dry.jpg";
import GudiyaCollectionLogo from "../../public/images/clients/gudiya_collection.png";
import MannubhaiLogo from "../../public/images/clients/mannubhai.webp";
import RoCareIndiaLogo from "../../public/images/clients/ro-care-india.webp";
import DoctorFresh from "../../public/images/clients/doctor-fresh.webp";

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
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false); // State for signup popup
  const [slidingTextIndex, setSlidingTextIndex] = useState(0); 
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBookDemoModal, setShowBookDemoModal] = useState(false);
  const [demoDetails, setDemoDetails] = useState(() => {
    const today = new Date();
    let initialDate = new Date(today);
    initialDate.setHours(16, 0, 0, 0); // Set time to 4 PM
  
    const dayOfWeek = initialDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
    // If today is Sunday, set to next Monday
    if (dayOfWeek === 0) {
      initialDate.setDate(initialDate.getDate() + 1);
    }
    // If today is Saturday, set to next Monday
    else if (dayOfWeek === 6) {
      initialDate.setDate(initialDate.getDate() + 2);
    }
    // If today is a weekday and it's already past 4 PM, set to next weekday 4 PM
    else if (today.getHours() >= 16) {
      initialDate.setDate(initialDate.getDate() + 1);
      // If next day is Saturday, move to Monday
      if (initialDate.getDay() === 6) {
        initialDate.setDate(initialDate.getDate() + 2);
      }
    }
    return { name: '', contact: '', selectedDate: initialDate };
  });
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);
  const [toast, setToast] = useState(null);
  const [demoBooked, setDemoBooked] = useState(false);
  
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', phone: '', email: '', gstNumber: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");

  const clientLogos = [
    // NOTE: Add your client logos in public/images/clients/
    { name: "Client 1", src: AnupGuptaLogo },
    { name: "Mannubhai", src: MannubhaiLogo },
    { name: "Ro-Care India", src: RoCareIndiaLogo },
    { name: "Client 2", src: DynamicDrapryLogo },
    { name: "Client 3", src: BanjaraSalonLogo },
    { name: "Client 4", src: MazzLogo },
    { name: "Client 6", src: GudiyaCollectionLogo },
    { name: "Client 5", src: LuckyDryLogo },
  ];

  const now = new Date();
  const isAfter4PM = now.getHours() >= 16; // 4 PM
  const isSunday = now.getDay() === 0;

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Check login status
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Show signup popup after a delay if not logged in
    if (!token) {
      const popupTimer = setTimeout(() => {
        setShowSignupPopup(true);
      }, 5000); // Show after 5 seconds
    }
    
    // ESC key to close modal
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
        setShowVideoModal(false);
        setSelectedVideo(null);
        setShowBookDemoModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);



    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAfter4PM]);

  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setSlidingTextIndex(prevIndex => (prevIndex + 1) % 5); // 5 is the number of slides
    }, 3000); // Change text every 3 seconds
    
    return () => {
      clearInterval(sliderInterval);
    };
  }, []);

  const handleNavigation = (path) => {
    if (isLoggedIn) {
      window.location.href = path;
    } else {
      window.location.href = '/login';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

 const handleBookDemoSubmit = useCallback(async (e) => {
  e.preventDefault();

  // Validate name & phone
  if (!demoDetails.name || !demoDetails.contact || !demoDetails.selectedDate) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  // Validate weekday
  const selectedDay = demoDetails.selectedDate.getDay();
  if (selectedDay === 0 || selectedDay === 6) {
    showToast("Seminars are available Monday to Saturday only.", "error");
    return;
  }

  setIsSubmittingDemo(true);

  try {
    const formattedDate = demoDetails.selectedDate.toISOString().split("T")[0];

    const res = await fetch("/api/bookDemo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: demoDetails.name,
        phone: demoDetails.contact,
        selectedDate: formattedDate, // send proper date
        seminarTime: "4:00 PM", // fixed time
        status: "Not Attended" // for admin panel
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Something went wrong.");

    // Success
    setDemoBooked(true);

    setTimeout(() => {
      setShowBookDemoModal(false);
      setDemoBooked(false);
    }, 2500);

  } catch (error) {
    showToast(`Error: ${error.message}`, "error");
  } finally {
    setIsSubmittingDemo(false);
  }
}, [demoDetails]);

  const handleDemoInputChange = (e) => {
    setDemoDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleServiceBookClick = async (plan) => {
    setSelectedPlan(plan);
    setBookingSuccess(false);
    setShowServiceModal(true);

    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const res = await fetch(`/api/auth/signup?userId=${userId}`);
        const data = await res.json();
        
        if (data) {
          setServiceForm({
            name: data.fullName || '',
            phone: data.phone || '',
            email: data.email || '',
            gstNumber: data.gst || ''
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    } else {
      setServiceForm({ name: '', phone: '', email: '', gstNumber: '' });
    }
  };

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

    const res = await loadRazorpayScript();
    if (!res) {
      showToast("Razorpay SDK failed to load. Are you online?", "error");
      return;
    }

    try {
      // 1. Create Order
      const amountVal = parseInt(selectedPlan.totalPrice.replace(/[^\d]/g, ''));
      
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


  

  
  

  const subscriptionPlans = [
    {
      title: "Basic Plan",
      basePrice: 999,
      totalAmount: 1179,
      basePosts: 5,
      baseCitations: 2,
      staticFeatures: ["Review Reply Management","Magic Qr Code Generation","Insights Dashboard"],
      description: "Ideal for small businesses needing basic online presence",
      color: "bg-blue-600",
      textColor: "text-blue-600",
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
      color: "bg-pink-600",
      textColor: "text-pink-600",
      borderColor: "border-pink-200"
    },
    {
      title: "Professional Plan",
      basePrice: 2500,
      totalAmount: 2950,
      basePosts: 15,
      baseCitations: 5,
      staticFeatures: ["Review Reply Management", "Magic Qr Code Generation","Insights Dashboard", "Category Addition & Optimization"],
      description: "Best for growing businesses looking for better visibility",
      color: "bg-purple-600",
      textColor: "text-purple-600",
      borderColor: "border-purple-200"
    },
 
  ];
  

  const getMultiplier = () => {
    switch (billingCycle) {
      case "quarterly": return 3;
      case "half-yearly": return 6;
      case "yearly": return 12;
      default: return 1;
    }
  };

  const calculatePrice = (basePrice) => {
    if (billingCycle === "monthly") return basePrice;
    if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.90);
    if (billingCycle === "half-yearly") return Math.round(basePrice * 6 * 0.85);
    if (billingCycle === "yearly") return Math.round(basePrice * 12 * 0.80);
    return basePrice;
  };

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
        // "Custom branding with your logo",
        "Weather-resistant material",
        // "Includes shipping charges",
        "Helps in getting more positive reviews"
      ],
      tag: "Best for: Offline businesses wanting to boost online reviews.",
      iconColor: "text-green-500",
      buttonColor: "bg-green-600"
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
      buttonColor: "bg-blue-600"
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
      iconColor: "text-purple-500",
      buttonColor: "bg-purple-600"
    },
 
  ];

  const features = [
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "AI Post Generation",
      description: "Create engaging GMB posts instantly with AI assistance",
      color: "from-blue-500 to-blue-600",
      link: "/post-management"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "Auto-schedule posts at optimal times for maximum reach",
      color: "from-purple-500 to-purple-600",
      link: "/post-management"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Review Management",
      description: "Respond to reviews with AI-powered suggestions",
      color: "from-pink-500 to-pink-600",
      link: "/review-management"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Magic QR",
      description: "Filter negative reviews with smart QR technology",
      color: "from-indigo-500 to-indigo-600",
      link: "/get-magic-qr"
    }
  ];

  const stats = [
    { value: "1000+", label: "Active Businesses" },
    { value: "25k+", label: "Posts Created" },
    { value: "98%", label: "Success Rate" },
    { value: "2X", label: "Traffic Growth" }
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
    // "https://res.cloudinary.com/dsnuzit6o/image/upload/v1763974160/tmpvnt2q3jh_bpq5vr.jpg",
    // "https://res.cloudinary.com/dsnuzit6o/image/upload/v1763959750/tmph8ajqrjv_hpteeq.jpg",
    // "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764303591/tmpaqv882lt_tre9wm.jpg",
    // "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764306448/tmpklqlkafr_b3ebuf.jpg"
  ];

  const videoExamples = [
    // "https://res.cloudinary.com/dwrbpboxy/video/upload/v1766144310/WhatsApp_Video_2025-12-19_at_5.03.11_PM_n15vft.mp4",
    // "https://res.cloudinary.com/dwrbpboxy/video/upload/v1766144310/WhatsApp_Video_2025-12-19_at_5.02.42_PM_jcrka8.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.11+PM.mp4",
    // "https://res.cloudinary.com/dwrbpboxy/video/upload/v1766144309/WhatsApp_Video_2025-12-19_at_5.03.45_PM_ryvxhc.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM+(2).mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765573/WhatsApp_Video_2026-01-07_at_11.24.14_AM_j6ck8w.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765583/WhatsApp_Video_2026-01-07_at_11.25.30_AM_adbkxc.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765586/WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4"
    // https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4
    // "https://res.cloudinary.com/dmjnssvi4/video/upload/v1765257394/replicate-prediction-mptsge8p1nrma0ctxstbv7gw3w_hpexdq.mp4",
    // "https://res.cloudinary.com/dmjnssvi4/video/upload/v1765257375/ayb6dhfrd1rme0ctzqqamzb3r8_mfrlhi.mp4",
    // "https://res.cloudinary.com/dmjnssvi4/video/upload/v1765257405/qb8jp2kssnrme0ctzjw97e1csr_oyza6u.mp4",
    // "https://res.cloudinary.com/dmjnssvi4/video/upload/v1765348863/x7xb3hqikxbqerd09rqu.mp4",
    // "https://res.cloudinary.com/dmjnssvi4/video/upload/v1765257376/replicate-prediction-m32c0jcsp1rme0ctxszvvth534_moiv4y.mp4",
    // "https://res.cloudinary.com/dmjnssvi4/video/upload/v1765257391/replicate-prediction-8j95jage5xrma0ctxsjrkra9e4_nrk6iq.mp4",
    // "https://res.cloudinary.com/dmjnssvi4/video/upload/v1765257391/replicate-prediction-24kcwzem45rme0ctxsnbrwaf48_grjpdv.mp4"
  ];

  const steps = [
    {
      icon: <LogIn className="w-8 h-8" />,
      title: "Sign Up Free",
      description: "Start your free trial in seconds. No credit card required.",
      details: ["Enter your mobile number", "Verify with OTP", "Access dashboard instantly"]
    },
    {
      icon: <Link2 className="w-8 h-8" />,
      title: "Connect GMB",
      description: "Securely link your Google Business Profile.",
      details: ["One-click authentication", "100% secure connection", "Takes less than 30 seconds"]
    },
    {
      icon: <LayoutGrid className="w-8 h-8" />,
      title: "Start Automating",
      description: "Create posts, manage reviews, and grow your business.",
      details: ["AI-powered content creation", "Auto-schedule posts", "Smart review responses"]
    }
  ];

  const testimonials = [
    {
      quote: "Limbu.ai has been a game-changer for our local business. We're saving hours every week on social media management!",
      author: "Ravi Kumar",
      title: "Owner, Kumar Electronics",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      quote: "The AI post generator is fantastic. The content is relevant and engaging. Our customer interaction has doubled.",
      author: "Priya Sharma",
      title: "Manager, Sharma Sweets",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg"
    },
    {
      quote: "I was skeptical about AI, but this tool is incredibly easy to use and delivers real results. The Magic QR feature is pure genius!",
      author: "Amit Singh",
      title: "Director, Singh & Co.",
      avatar: "https://randomuser.me/api/portraits/men/3.jpg"
    }
  ];
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const slidingTexts = [
    { icon: "🚫", text: "No Subscriptions • No Hidden Fees" },
    { icon: "👍", text: "Zero Commitment • 100% Risk-Free" },
    { icon: "🕊️", text: "No Wallet Bound • Use Anytime" },
    { icon: "💳", text: "No Credit Card Needed • Start Instantly" },
    { icon: "🤖", text: "Fully Automated • No Technical Skills" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="absolute w-96 h-96 bg-blue-300 rounded-full blur-3xl -top-48 -left-48"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        />
        <div 
          className="absolute w-96 h-96 bg-purple-300 rounded-full blur-3xl top-1/2 -right-48"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-white/50">
            <button onClick={() => setShowSignupPopup(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-200 transition">
              <X className="w-6 h-6" />
            </button>

            <div className="text-yellow-300 mb-4">
              <Gift className="w-16 h-16 mx-auto animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Hurry Up!</h2>
            <p className="text-white/90 text-lg mb-6">
              Sign up now to get <strong className="text-yellow-300">500 bonus coins</strong> and create amazing posts instantly!
            </p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full group px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              Signup Fast & Get Coins
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Video Demo Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowVideoModal(false)}>
          <div className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowVideoModal(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-200 transition z-10">
              <X className="w-6 h-6" />
            </button>
            <iframe
              className="w-full h-full rounded-2xl"
              src="https://www.youtube.com/embed/eQUd6u36w3g?si=MldrJE88pub19Y8s"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Book Demo Modal */}
      {showBookDemoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <button onClick={() => setShowBookDemoModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
              <X className="w-6 h-6" />
            </button>
            {demoBooked ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Booked Successfully!</h2>
                <p className="text-slate-600">We will contact you shortly. The window will close automatically.</p>
              </div>

            ) : isSunday ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Seminars Unavailable</h2>
                <p className="text-slate-600">We are closed on Sundays. Please book a demo for another day.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Book Your Free Demo</h2>
                <form onSubmit={handleBookDemoSubmit} className="space-y-4">
  <input
    type="text"
    name="name"
    placeholder="Your Name"
    value={demoDetails.name}
    onChange={handleDemoInputChange}
    required
    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
  />

  <input
    type="tel"
    name="contact"
    placeholder="Contact Number"
    value={demoDetails.contact}
    onChange={handleDemoInputChange}
    required
    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
  />

  {/* Date Selection */}
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-2">
      Select Seminar Date (Monday - Saturday):
    </label>

    <input
      type="date"
      name="selectedDate"
      value={demoDetails.selectedDate.toISOString().split("T")[0]}
      min={new Date().toISOString().split("T")[0]}
      onChange={(e) =>
        setDemoDetails((prev) => ({
          ...prev,
          selectedDate: new Date(e.target.value),
        }))
      }
      required
      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
    />

    <p className="text-sm font-medium text-slate-600 mt-2">Time: 4:00 PM</p>
  </div>

  <button
    type="submit"
    disabled={isSubmittingDemo}
    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-60"
  >
    {isSubmittingDemo ? "Submitting..." : "Submit Request"}
  </button>
</form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
{selectedVideo && (
  <div
    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto p-4"
    onClick={() => setSelectedVideo(null)}
  >
    <div className="w-full min-h-screen flex items-start justify-center mt-24 mb-10">
      <div
        className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl aspect-video max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setSelectedVideo(null)}
          className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-200 transition z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <video
          src={selectedVideo}
          controls
          autoPlay
          preload="auto"
          className="w-full h-full object-contain rounded-2xl"
        />
      </div>
    </div>
  </div>
)}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 to-transparent"></div>
              <span className="text-xl sm:text-2xl relative z-10">
                                <Image src={LogoImage} alt="Limbu.ai Logo" className="w-6 h-6 sm:w-8 sm:h-8" />

              </span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">limbu.ai</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Social & Local Growth</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">How It Works</a>
            <a href="#services" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Our services</a>
            {/* <a href="#examples" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Example</a> */}
            <a href="/franchise-opportunities" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Become Franchise Partners</a>
            <button
              onClick={() => setShowBookDemoModal(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              Book a Demo
            </button>
            <a
              href="https://wa.me/919289344726"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition p-2 border border-green-500 rounded-lg animate-pulse-border"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 fill-current"><path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z"/></svg>
              9289344726
            </a>
            
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="px-5 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => window.location.href = '/login'} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                Login
              </button>
            )}
          </nav>

          {/* Mobile: Call Now + Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <a 
              href="tel:9289344726" 
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              9289344726
            </a>
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-800">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold overflow-hidden whitespace-nowrap shadow-lg">
        <div className="flex gap-14 animate-scroll py-3">
          <span className="text-sm sm:text-base">🎄 Merry Christmas & Happy New Year — Flat 50% Off! 🎁</span>
          <span className="text-sm sm:text-base">🤖 AI Post Creation: only 80 coins!</span>
          <span className="text-sm sm:text-base">🚀 GMB Posting: only 20 coins!</span>

          <span className="text-sm sm:text-base">🎄 Merry Christmas & Happy New Year — Flat 50% Off! 🎁</span>
          <span className="text-sm sm:text-base">🤖 AI Post Creation: only 80 coins!</span>
          <span className="text-sm sm:text-base">🚀 GMB Posting: only 20 coins!</span>
        </div>
      </div> */}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 p-6 md:hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">Menu</h2>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-700">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-700">How It Works</a>
            <a href="#examples" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-700">Examples</a>
            <a href="/franchise-opportunities" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-700">Become Franchise Partners</a>
            <button onClick={() => { setShowBookDemoModal(true); setIsMobileMenuOpen(false); }} className="text-lg font-medium text-blue-600 text-left">
              Book a Demo
            </button>
            {isLoggedIn ? (
              <>
                <button onClick={() => handleNavigation('/dashboard')} className="mt-4 px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg font-semibold">
                  Dashboard
                </button>
                <button onClick={handleLogout} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => window.location.href = '/login'} className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold">
                Login
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[80vh] md:h-screen w-full flex items-end md:items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]"></div>
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px]"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-600/20 blur-[120px]"></div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
        <div className="relative z-20 text-center max-w-4xl mx-auto px-4 sm:px-6 pb-20 md:pb-0">
          {/* Sliding Text Badge */}
          <div className="relative h-10 mb-4 sm:mb-8 flex items-center justify-center">
            {slidingTexts.map((item, index) => (
              <div
                key={index}
                className={`absolute w-full transition-opacity duration-500 ease-in-out ${index === slidingTextIndex ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-blue-200 rounded-full shadow-sm">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-700">{item.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Headline */}
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold leading-tight mb-4 ml-[10px]">
  <span className="text-white">
    The All-in-One AI Marketing Platform for Google,
  </span>
  <br />
  <span className="text-white">
    Facebook & Instagram. 
  </span>
  <br/>
  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
     Stop juggling tabs.
  </span>
</h1>




          {/* Subheadline */}
        <p className="text-sm sm:text-lg md:text-xl text-slate-200 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
  Grow your revenue with Limbu.ai — the AI command center for Google Business Profile and social media automation.
</p>




          {/* CTA Button */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">
            <button 
              onClick={() => handleNavigation(isLoggedIn ? '/dashboard' : '/login')}
              className="group w-auto px-4 sm:px-8 py-3 sm:py-4 bg-transparent border border-2 backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center gap-2 hover:shadow-xl hover:border-slate-400"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setShowVideoModal(true)}
              className="group w-auto px-4 sm:px-8 py-3 sm:py-4 bg-transparent backdrop-blur-sm border-2 border-white/30 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg hover:shadow-xl hover:border-slate-400 transition-all inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>
              Watch Demo
            </button>
          </div>

          {/* Mobile App Download */}
          
        </div>
      </section>

      {/* Client Logos Section */}
 <section className="bg-white py-12 sm:py-10 border-b border-slate-100">
  <div className="max-w-9xl mx-auto px-4 sm:px-6">
    <div className="text-center mb-12 sm:mb-16">
      <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
        Trusted by Industry Leaders
      </p>
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-sm sm:text-base font-semibold text-slate-600">1,000+ Growing Businesses</span>
      </div>
    </div>
    
    <div className="relative w-full overflow-hidden py-4">
      <div className="flex gap-12 sm:gap-16 md:gap-20 lg:gap-24 animate-scroll-logos items-center w-max hover:[animation-play-state:paused]">
        {[...clientLogos, ...clientLogos, ...clientLogos].map((logo, idx) => (
          <div 
            key={idx} 
            className="flex-shrink-0 transform hover:scale-110 transition-transform duration-300"
          >
            <div className="h-20 w-32 sm:h-24 sm:w-40 md:h-28 md:w-44 flex items-center justify-center">
              <Image
                src={logo.src}
                alt={logo.name}
                width={176}
                height={112}
                className="w-1/2 h-1/2 object-contain filter brightness-90 hover:brightness-100 transition-all duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>

          {/* <MobileAppBanner /> */}



      


      

      {/* Examples Section - Moved Up */}
      <section id="examples" className="relative bg-white py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              AI-Generated <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Post Examples</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">See what our AI creates for businesses like yours</p>
          </div>
          <div className="relative h-64 overflow-hidden rounded-2xl">
            <div className="flex gap-4 animate-scroll">
              {[...postImages, ...postImages].map((image, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-64 h-64 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`Post example ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      

      {/* Video Examples Section */}
      <section id="video-examples" className="relative bg-slate-50 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              Stunning <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Video Creations</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">Watch our AI bring ideas to life with video.</p>
          </div>
          <div className="relative h-80 overflow-hidden rounded-2xl">
            <div className="flex gap-4 animate-scroll-videos">
              {[...videoExamples, ...videoExamples].map((videoSrc, idx) => (
                <button
                  key={idx}
                  className="flex-shrink-0 w-56 h-80 cursor-pointer hover:scale-105 transition-transform group relative focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-50 rounded-xl"
                  onClick={() => setSelectedVideo(videoSrc)}
                >
                  <video src={videoSrc} loop muted autoPlay playsInline preload="auto" className="w-full h-full object-cover rounded-xl shadow-lg" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <Video className="w-12 h-12 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
          {/* Features Section */}
     <section id="features" className="relative bg-white py-12 sm:py-16 md:py-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6">
    <div className="text-center mb-10 sm:mb-14">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
        Everything You Need in <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">One Place</span>
      </h2>
      <p className="text-base sm:text-lg text-slate-600 px-4">Powerful features designed for busy business owners</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {features.map((feature, idx) => (
        <div
          key={idx}
          onClick={() => handleNavigation(feature.link)}
          className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 cursor-pointer"
        >
          {/* Icon */}
          <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
            {feature.icon}
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-slate-950 transition-colors">
            {feature.title}
          </h3>
          
          {/* Description */}
          <p className="text-slate-600 text-sm leading-relaxed mb-4 min-h-[40px]">
            {feature.description}
          </p>
          
          {/* CTA */}
          <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
            Try Now 
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

          {/* Services Section */}
      <section id="services" className="relative bg-slate-50 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Service Plans</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">Choose the perfect plan for your business growth</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {servicePlans.map((plan, idx) => (
              <div key={idx} className={`relative bg-white rounded-2xl shadow-xl border ${plan.popular ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2' : 'border-slate-200'} p-5 flex flex-col`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.title}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{plan.subtitle}</p>
                </div>

                <div className="flex-grow space-y-4 mb-6">
                  {plan.features && (
                    <ul className="space-y-3">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3 text-sm text-slate-600">
                          <CheckCircle className={`w-5 h-5 ${plan.iconColor} flex-shrink-0`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {plan.sections && plan.sections.map((section, sIdx) => (
                    <div key={sIdx}>
                      <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">{section.title}</h4>
                      <ul className="space-y-3">
                        {section.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-3 text-sm text-slate-600">
                            <CheckCircle className={`w-5 h-5 ${plan.iconColor} flex-shrink-0`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {plan.tag && (
                    <div className="mb-4 p-2 bg-slate-50 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-100">
                        {plan.tag}
                    </div>
                )}

                <button
                  onClick={() => handleServiceBookClick(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 ${plan.buttonColor}`}
                >
                  Book Service
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>


          {/* Subscription Plans Section */}
      <section id="subscription-plans" className="relative bg-white py-16 sm:py-20 md:py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Package</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8">Choose the Package that suits your business needs</p>

            {/* Billing Cycle Toggle */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['monthly', 'quarterly', 'half-yearly', 'yearly'].map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    billingCycle === cycle
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cycle === 'monthly' ? 'Monthly' : 
                   cycle === 'quarterly' ? 'Quarterly' : 
                   cycle === 'half-yearly' ? 'Half-Yearly' : 'Yearly'}
                  {cycle === 'quarterly' && <span className="ml-1 text-xs text-green-400">-10%</span>}
                  {cycle === 'half-yearly' && <span className="ml-1 text-xs text-green-400">-15% (Recommended)</span>}
                  {cycle === 'yearly' && <span className="ml-1 text-xs text-green-400">-20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan, idx) => {
              const price = calculatePrice(plan.basePrice);
              const multiplier = getMultiplier();
              const displayFeatures = [
                `${plan.basePosts * multiplier} GMB Posts`,
                `${plan.baseCitations * multiplier} Citations`,
                ...plan.staticFeatures
              ];

              return (
                <div key={idx} className={`relative bg-white rounded-2xl shadow-xl border ${plan.popular ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2' : 'border-slate-200'} p-6 flex flex-col transition-transform hover:scale-105`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className={`text-xl font-bold ${plan.textColor} mb-2`}>{plan.title}</h3>
                    <p className="text-sm text-slate-500 mb-4 h-10">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">₹{price.toLocaleString()}</span>
                      <span className="text-sm text-slate-500 font-medium">
                        {billingCycle === 'monthly' ? '/ month' : 
                         billingCycle === 'quarterly' ? '/ quarter' :
                         billingCycle === 'half-yearly' ? '/ 6 months' : '/ year'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">+ 18% GST</div>
                    {billingCycle !== 'monthly' && (
                       <div className="text-xs text-green-600 font-semibold mt-1">
                         Save ₹{((plan.basePrice * (billingCycle === 'quarterly' ? 3 : billingCycle === 'half-yearly' ? 6 : 12)) - price).toLocaleString()}
                       </div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {displayFeatures.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle className={`w-5 h-5 ${plan.textColor} flex-shrink-0`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscriptionClick(plan)}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all ${plan.color}`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      
  

         <section id="comparison" className="py-24 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-64 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
              🤖 Why Smart Businesses <br className="hidden md:block" /> Switch to Limbu.ai
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              It’s not just automation; it’s reputation management. See the difference.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Review Replies</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
                  <div className="mt-1"><X className="w-5 h-5 text-red-500" /></div>
                  <div>
                    <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">The Old Way</div>
                    <p className="text-slate-600 text-sm leading-relaxed">Manually typing replies days later, often missing important customer feedback.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                  <div className="mt-1"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">The Limbu.ai Way</div>
                    <p className="text-slate-800 font-semibold text-sm leading-relaxed">Instant AI responses that boost SEO and customer satisfaction immediately.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Content Planning</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
                  <div className="mt-1"><X className="w-5 h-5 text-red-500" /></div>
                  <div>
                    <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">The Old Way</div>
                    <p className="text-slate-600 text-sm leading-relaxed">Switching between 3 different apps and spreadsheets to manage posts.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                  <div className="mt-1"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">The Limbu.ai Way</div>
                    <p className="text-slate-800 font-semibold text-sm leading-relaxed">One Unified Calendar for Google, Facebook, & Instagram automation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Scalability</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
                  <div className="mt-1"><X className="w-5 h-5 text-red-500" /></div>
                  <div>
                    <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">The Old Way</div>
                    <p className="text-slate-600 text-sm leading-relaxed">Struggling to manage just one location effectively without chaos.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                  <div className="mt-1"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">The Limbu.ai Way</div>
                    <p className="text-slate-800 font-semibold text-sm leading-relaxed">Managing unlimited locations effortlessly from a single dashboard.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Security</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
                  <div className="mt-1"><X className="w-5 h-5 text-red-500" /></div>
                  <div>
                    <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">The Old Way</div>
                    <p className="text-slate-600 text-sm leading-relaxed">Sharing passwords insecurely via email or chat.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                  <div className="mt-1"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">The Limbu.ai Way</div>
                    <p className="text-slate-800 font-semibold text-sm leading-relaxed">Official API Integration. 100% Secure & Encrypted.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



         <section id="features" className="relative bg-white py-12 sm:py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 px-4">
              ⚙️ Your Growth Engine <br />
              <span className="text-blue-600">3 Platforms, 1 Intelligent Dashboard</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">Manage everything from a single view. No more switching apps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-4">
            {/* Google Feature */}
            <div className="group p-8 rounded-3xl border border-slate-100 bg-white shadow-lg hover:shadow-2xl hover:border-blue-100 transition duration-300">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📍</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Google Business Profile (GBP) Automation</h3>
              <p className="text-blue-600 font-semibold mb-4 text-sm uppercase tracking-wide">Rank higher in the "Local Pack" and Maps</p>
              <p className="text-slate-600 mb-6 leading-relaxed">Your Google profile is your new homepage. Limbu.ai ensures it never sleeps.</p>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start"><span className="mr-3 text-green-500 font-bold">✔</span> <span><strong>Auto-Post Scheduler:</strong> Keep your profile active with AI-generated updates, offers, and events to send positive ranking signals to Google.</span></li>
                <li className="flex items-start"><span className="mr-3 text-green-500 font-bold">✔</span> <span><strong>AI Review Management:</strong> Never leave a review hanging. Our AI drafts personalized, keyword-rich replies to 5-star praise and critical feedback instantly.</span></li>
                <li className="flex items-start"><span className="mr-3 text-green-500 font-bold">✔</span> <span><strong>Local SEO Insights:</strong> Track calls, direction requests, and search visibility from a single clear view.</span></li>
              </ul>
            </div>

            {/* Facebook Feature */}
            <div className="group p-8 rounded-3xl border border-slate-100 bg-white shadow-lg hover:shadow-2xl hover:border-blue-100 transition duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">💬</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Facebook Growth Autopilot</h3>
              <p className="text-blue-600 font-semibold mb-4 text-sm uppercase tracking-wide">Turn followers into loyal customers</p>
              <p className="text-slate-600 mb-6 leading-relaxed">Plan months of content in minutes. Our AI analyzes your audience to post when engagement is highest.</p>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start"><span className="mr-3 text-green-500 font-bold">✔</span> <span><strong>Smart Scheduling:</strong> Plan months of content in minutes.</span></li>
                <li className="flex items-start"><span className="mr-3 text-green-500 font-bold">✔</span> <span><strong>Inbox Zero:</strong> Consolidate Messenger, comments, and recommendations. Let AI handle the FAQs so you can handle the sales.</span></li>
              </ul>
            </div>

         {/* Instagram Feature */}
<div className="group p-8 rounded-3xl border border-slate-100 bg-white shadow-lg hover:shadow-2xl hover:border-blue-100 transition duration-300">
  <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
    📸
  </div>

  <h3 className="text-2xl font-bold text-slate-900 mb-3">
    Instagram Visibility Booster
  </h3>

  <p className="text-blue-600 font-semibold mb-4 text-sm uppercase tracking-wide">
    Expand your reach with visual content
  </p>

  <p className="text-slate-600 mb-6 leading-relaxed">
    Manage and publish Instagram content easily from one powerful dashboard.
  </p>

  <ul className="space-y-3 text-slate-700">
    <li className="flex items-start">
      <span className="mr-3 text-green-500 font-bold">✔</span>
      <span>
        <strong>Reels & Post Automation:</strong> Schedule and publish posts without mobile limitations.
      </span>
    </li>

    <li className="flex items-start">
      <span className="mr-3 text-green-500 font-bold">✔</span>
      <span>
        <strong>Smart Engagement:</strong> AI-powered hashtags and captions to boost reach and visibility.
      </span>
    </li>
  </ul>
</div>

          </div>
        </div>
      </section>

      {/* Data-Driven Decisions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            📊 Data-Driven Decisions <br/>
            <span className="text-base font-normal text-slate-600">(No Spreadsheet Skills Required)</span>
          </h2>
          <p className="text-lg text-slate-600 mb-12 max-w-3xl mx-auto">
            Don't guess what works—know it. Limbu.ai aggregates data across platforms to show you the "North Star" metrics.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Sentiment Analysis</h3>
                <p className="text-slate-600">Understand how customers feel about your brand based on review language.</p>
             </div>
             <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Conversion Tracking</h3>
                <p className="text-slate-600">See exactly which posts drove calls or website clicks.</p>
             </div>
          </div>
        </div>
      </section>

        <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-16">🧩 Built for Your Business Model</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100 text-center">
              <div className="text-5xl mb-6">🏪</div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Local Heroes</h3>
              <p className="text-slate-600 leading-relaxed">Restaurants, Salons, Clinics, and Retailers looking for foot traffic.</p>
            </div>
            {/* <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100 text-center">
              <div className="text-5xl mb-6">🏢</div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Agencies</h3>
              <p className="text-slate-600 leading-relaxed">Manage 100+ client locations from a single master login.</p>
            </div> */}
            <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100 text-center">
              <div className="text-5xl mb-6">🌎</div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Multi-Location Brands</h3>
              <p className="text-slate-600 leading-relaxed">Ensure brand consistency across every franchise outlet.</p>
            </div>
          </div>
        </div>
      </section>

      

      



  

  

      {/* How It Works */}
     
      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-16 sm:py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4">
              Loved by Businesses <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Like Yours</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600">Real stories from our happy customers</p>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 overflow-hidden">
              <div className="absolute top-8 left-8 text-6xl text-blue-100 -z-0">❞</div>
              <div className="relative z-10 transition-opacity duration-300">
                <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 mb-6 text-center">
                  {testimonials[currentTestimonial].quote}
                </p>
                <div className="flex items-center justify-center">
                  <img src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].author} className="w-12 h-12 rounded-full mr-4 border-2 border-blue-200" />
                  <div>
                    <div className="font-bold text-slate-900">{testimonials[currentTestimonial].author}</div>
                    <div className="text-sm text-slate-500">{testimonials[currentTestimonial].title}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-6 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>


         <section id="faq" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">❓ Frequently Asked Questions</h2>
            <p className="text-slate-500">Optimized for Voice Search & "People Also Ask"</p>
          </div>
          
          <div className="space-y-4">
            <details className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group transition-all duration-300 open:shadow-md">
              <summary className="text-lg font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                What is Limbu.ai and how does it help Local SEO?
                <span className="text-blue-500 transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                Limbu.ai is an AI marketing platform that automates Google Business Profile activity. By consistently posting updates and replying to reviews instantly (two major Google ranking factors), it helps improve your visibility in local "near me" search results.
              </div>
            </details>

            <details className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group transition-all duration-300 open:shadow-md">
              <summary className="text-lg font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                Is it safe to connect my Google and Facebook accounts?
                <span className="text-blue-500 transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                Yes. Limbu.ai uses official, secure OAuth interactions directly approved by Google and Meta. We never store your passwords, and our connection is encrypted with enterprise-grade security.
              </div>
            </details>

            <details className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group transition-all duration-300 open:shadow-md">
              <summary className="text-lg font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                Can I manage multiple locations for different clients?
                <span className="text-blue-500 transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                Absolutely. Limbu.ai is designed for scale. You can toggle between different brands or locations within the same dashboard, making it the perfect tool for digital agencies.
              </div>
            </details>

            <details className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group transition-all duration-300 open:shadow-md">
              <summary className="text-lg font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                Does Limbu.ai actually write the content for me?
                <span className="text-blue-500 transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                Yes. Our generative AI helps create captions, suggest hashtags, and draft review replies. You always have full control to edit or approve content before it goes live.
              </div>
            </details>
          </div>
        </div>
      </section>


      {/* Examples Section */}
      {/* <section id="examples" className="relative bg-white py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              AI-Generated <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Post Examples</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">See what our AI creates for businesses like yours</p>
          </div>

          <div className="relative h-64 overflow-hidden rounded-2xl">
            <div className="flex gap-4 animate-scroll">
              {[...postImages, ...postImages].map((image, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-64 h-64 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`Post example ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* Trust Section */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">🔒 Trusted Architecture & Security</h2>
          <div className="flex flex-col md:flex-row flex-wrap items-start justify-center gap-8 sm:gap-12 text-white">
            <div className="flex items-center gap-3">
              <Shield className="w-6 sm:w-8 h-6 sm:h-8" />
              <div>
                <div className="font-bold text-base sm:text-lg">Trust is our currency</div>
                <div className="text-blue-100 text-xs sm:text-sm">Limbu.ai is built by digital marketing veterans with 15+ years of SEO experience. We strictly adhere to Google’s API Terms of Service and Meta’s Platform Policies.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 sm:w-8 h-6 sm:h-8" />
              <div>
                <div className="font-bold text-base sm:text-lg">Zero Data Sharing</div>
                <div className="text-blue-100 text-xs sm:text-sm">Your customer data is encrypted and never sold.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-6 sm:w-8 h-6 sm:h-8 fill-white" />
              <div>
                <div className="font-bold text-base sm:text-lg">Real-Time Compliance</div>
                <div className="text-blue-100 text-xs sm:text-sm">We update our AI as platform algorithms change, keeping your accounts safe and compliant.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-4">
            Ready to Automate Your Growth?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 px-4">
            Stop wasting hours on manual posting. Start building a reputation that ranks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => handleNavigation(isLoggedIn ? '/dashboard' : '/login')}
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start Your Free 14-Day Trial"}
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <button 
              onClick={() => setShowBookDemoModal(true)}
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white border-2 border-slate-300 text-slate-800 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:shadow-xl hover:border-slate-400 transition-all"
            >
              Book a Demo
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 px-4">No credit card required. Full feature access. Cancel anytime.</p>
        </div>
      </section>
                {/* <MobileAppBanner /> */}


      {/* Footer */}
      <footer className="relative bg-slate-900 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Logo Column */}
           {/* Logo Column */}
<div className="col-span-2 md:col-span-1">
  <div
    className="flex items-center gap-2 mb-3 sm:mb-4 cursor-pointer"
    onClick={() => handleNavigation('/dashboard')}
  >
    <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 to-transparent"></div>
      <Image
        src={LogoImage}
        alt="Limbu.ai Logo"
        className="w-6 h-6 sm:w-8 sm:h-8 relative z-10"
      />
    </div>
    <span className="font-bold text-base sm:text-lg">limbu.ai</span>
  </div>

  <p className="text-slate-400 text-xs sm:text-sm">
    Limbu.ai is an AI marketing platform that automates Google Business Profile &
    Social Media activity.
  </p>

  {/* Social Icons */}
  <div className="flex gap-4 mt-4">
    <a href="https://www.facebook.com/limbuai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition">
      <Facebook className="w-5 h-5" />
    </a>
    <a href="https://www.instagram.com/limbuai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition">
      <Instagram className="w-5 h-5" />
    </a>
    <a href="https://www.youtube.com/@limbuai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition">
      <Youtube className="w-5 h-5" />
    </a>
    <a href="https://www.linkedin.com/company/limbuai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition">
      <Linkedin className="w-5 h-5" />
    </a>
  </div>

  {/* Mobile App Download */}
  <div className="mt-5">
    <p className="text-xs text-slate-500 mb-2">Get our Mobile App</p>
    <a
      href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block hover:scale-105 transition-transform"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
        alt="Get it on Google Play"
        className="h-10"
      />
    </a>
  </div>
</div>


            {/* Links Columns */}
            {/* Links Columns */}
            <div>
              <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li><button onClick={() => handleNavigation('/post-management')} className="hover:text-white transition">Post Management</button></li>
                <li><button onClick={() => handleNavigation('/review-management')} className="hover:text-white transition">Review Management</button></li>
                <li><button onClick={() => handleNavigation('/magic-qr')} className="hover:text-white transition">Magic QR</button></li>
                <li><button onClick={() => handleNavigation('/dashboard')} className="hover:text-white transition">Dashboard</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
                <li><a href="/privacy-policy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="/terms-and-conditions" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li><a href="/contact" className="hover:text-white transition">Help Center</a></li>
                <li><a href="tel:9289344726" className="hover:text-white transition">Call: 9289344726</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-slate-400">
            © {new Date().getFullYear()} limbu.ai. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 sm:-top-16 sm:-right-16 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-2xl group z-10"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Image Container */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={selectedImage}
                alt="Enlarged post"
                className="w-full h-auto object-contain max-h-[80vh]"
              />
              
              {/* Image Overlay Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-semibold text-lg">AI Generated Post</p>
                <p className="text-white/80 text-sm">Created automatically for Google My Business</p>
              </div>
            </div>

            {/* Click Outside Hint */}
            <p className="text-white/60 text-center mt-4 text-sm">Click outside or press ESC to close</p>
          </div>
        </div>
      )}

      {/* Service Booking Modal */}
      {showServiceModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <button 
                onClick={() => setShowServiceModal(false)} 
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
            
            {bookingSuccess ? (
              <div className="text-center py-10 px-6 rounded-2xl bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-lg">
  <CheckCircle className="w-18 h-18 text-green-500 mx-auto mb-5 animate-bounce" />

  <h2 className="text-3xl font-extrabold text-slate-800 mb-3">
    Thank You for Your Booking! 🎉
  </h2>

  <p className="text-slate-600 text-base mb-4">
    Your service has been <span className="font-semibold text-green-600">successfully booked</span>.
  </p>

  <p className="text-slate-500 text-sm">
    Our team will contact you shortly to confirm the details and assist you further.
  </p>

  <div className="mt-6 inline-block bg-green-100 text-green-700 text-xs font-semibold px-4 py-2 rounded-full">
    Booking Confirmed
  </div>
</div>

            ) : (
            <>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Book {selectedPlan.title}</h2>
            <p className="text-slate-600 mb-6">Complete the details below to proceed to payment.</p>
            
            <div className="bg-slate-50 p-2 rounded-lg mb-4 border border-slate-100">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                        <span className="font-semibold">{selectedPlan.price}</span>
                        <span className="mx-1 text-slate-400">+</span>
                        <span className="font-semibold">{selectedPlan.gstAmount}</span>
                        <span className="ml-1 text-xs text-slate-500">(GST)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">Total:</span>
                        <span className="text-lg font-bold text-blue-600">{selectedPlan.totalPrice}</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{selectedPlan.subtitle}</p>
            </div>

            <form onSubmit={handleServicePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={serviceForm.phone}
                  onChange={(e) => setServiceForm({...serviceForm, phone: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={serviceForm.email}
                  onChange={(e) => setServiceForm({...serviceForm, email: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={serviceForm.gstNumber}
                  onChange={(e) => setServiceForm({...serviceForm, gstNumber: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter GST number"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-[1.02] mt-2 text-sm"
              >
                Pay Now
              </button>
            </form>
            </>
            )}
          </div>
        </div>
      )}

      <SupportModal showToast={showToast} />

      {/* Floating WhatsApp Button */}
<a
  href="https://wa.me/919289344726"
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-5 right-5 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
  aria-label="Chat on WhatsApp"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className="w-9 h-9 fill-white"
  >
    <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z"/>
  </svg>
</a>

<script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Limbu.ai",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            },
            "mainEntity": {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Limbu.ai and how does it help Local SEO?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Limbu.ai is an AI marketing platform that automates Google Business Profile activity. By consistently posting updates and replying to reviews instantly (two major Google ranking factors), it helps improve your visibility in local \"near me\" search results."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is it safe to connect my Google and Facebook accounts?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Limbu.ai uses official, secure OAuth interactions directly approved by Google and Meta. We never store your passwords, and our connection is encrypted with enterprise-grade security."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I manage multiple locations for different clients?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. Limbu.ai is designed for scale. You can toggle between different brands or locations within the same dashboard, making it the perfect tool for digital agencies."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does Limbu.ai actually write the content for me?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Our generative AI helps create captions, suggest hashtags, and draft review replies. You always have full control to edit or approve content before it goes live."
                  }
                }
              ]
            }
          })
        }}
      />

      <style jsx>{`
        @eyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        @keyframes scroll-logos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-logos {
          animation: scroll-logos 40s linear infinite;
        }
        @keyframes scroll-videos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${videoExamples.length * (14 + 1)}rem); } /* (width + gap) * number of videos */
        }
        .animate-scroll-videos { animation: scroll-videos 40s linear infinite; }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(34, 197, 94, 0.4); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { border-color: rgba(34, 197, 94, 1); box-shadow: 0 0 10px 0 rgba(34, 197, 94, 0.6); }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
