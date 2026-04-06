"use client";

import {
  ArrowRight,
  CheckCircle,
  Star,
  PhoneCall,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Shield,
  Zap,
  BarChart,
  Target,
  Rocket,
  Clock,
  HeadphonesIcon,
  BookOpen,
  Gift,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import ScrollToTop from "@/components/ui/ScrollToTop";
import BookDemoModal from "@/components/modals/WebinarBooking";

export default function FranchisePage() {

  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [showForm, setShowForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    gstNumber: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleOpenForm = async (plan = null) => {
    if (plan) setSelectedPlan(plan);
    setShowForm(true);

    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const res = await fetch(`/api/auth/signup?userId=${userId}`);
        const data = await res.json();

        if (data) {
          setServiceForm((prev) => ({
            ...prev,
            name: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            gstNumber: data.gst || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    } else {
      setServiceForm((prev) => ({
        ...prev,
        name: "",
        phone: "",
        email: "",
        gstNumber: "",
      }));
    }
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

    if (
      !serviceForm.name ||
      !serviceForm.phone ||
      !serviceForm.email ||
      !serviceForm.city
    ) {
      alert("Please fill all required fields");
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // Calculate amounts
    const investmentAmount = profitCalculations[selectedPlan].investment;
    const gstAmount = Math.round(investmentAmount * 0.18);
    const totalAmount = investmentAmount + gstAmount;

    try {
      // 1. Create Order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          amount: totalAmount, // Send total amount including GST
          receipt: `franchise_${Date.now()}`,
          notes: {
            plan_name: selectedPlan,
            user_email: serviceForm.email,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (orderData.error) {
        alert("Error creating payment order");
        return;
      }

      // 2. Open Razorpay
      const options = {
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_RwX1nRfZbVyVwT",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Limbu.ai Franchise",
        description: `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan Franchise Fee`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const res = await fetch("/api/franchise", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...serviceForm,
                plan: selectedPlan,
                investment: investmentAmount,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: totalAmount, // Send total amount paid
                status: "paid",
              }),
            });

            if (res.ok) {
              setFormSubmitted(true);
              setTimeout(() => {
                setShowForm(false);
                setFormSubmitted(false);
                setServiceForm({
                  name: "",
                  phone: "",
                  email: "",
                  city: "",
                  gstNumber: "",
                });
              }, 3000);
            } else {
              const data = await res.json();
              alert(data.message || "Something went wrong. Please try again.");
            }
          } catch (error) {
            console.error("Error submitting form:", error);
            alert(
              "Failed to submit application. Please check your connection.",
            );
          }
        },
        prefill: {
          name: serviceForm.name,
          email: serviceForm.email,
          contact: serviceForm.phone,
        },
        theme: {
          color: "#2563EB",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to initiate payment.");
    }
  };

  const profitCalculations = {
    starter: {
      clients: 20,
      revenue: 70,
      investment: 50000,
      monthly: 12000,
      yearly: 144000,
      profitPercent: 30,
      platformFeePercent: 50,
    },
    standard: {
      clients: 50,
      revenue: 60,
      investment: 100000,
      monthly: 37500,
      yearly: 450000,
      profitPercent: 40,
      platformFeePercent: 40,
    },
    premium: {
      clients: 100,
      revenue: 50,
      investment: 500000,
      monthly: 90000,
      yearly: 1080000,
      profitPercent: 50,
      platformFeePercent: 30,
    },
  };

  // Reactive amount calculations for UI
  const investmentAmount = profitCalculations[selectedPlan].investment;
  const gstAmount = Math.round(investmentAmount * 0.18);
  const totalAmount = investmentAmount + gstAmount;

  return (
    <div className="w-full bg-gray-50 text-gray-900">
      <Navbar />
      {/* =================== APPLICATION FORM MODAL =================== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {/* Modal Container */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            {/* Close Button */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-all hover:scale-110 z-10"
            >
              <X className="w-5 h-5 text-white hover:text-red-400" />
            </button>

            {!formSubmitted ? (
              <>
                {/* Header */}
                <div className="p-8 border-b border-white/10 text-center">
                  <div className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-semibold bg-[#FDE047] text-black">
                    ⚡ Limited Slots Available
                  </div>

                  <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2">
                    Start Your Franchise Journey
                  </h2>

                  <p className="text-white/60">
                    Fill the form and our team will contact you within 24 hours
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                      { value: "500+", label: "Partners" },
                      { value: "98%", label: "Success Rate" },
                      { value: "₹2.5L+", label: "Avg. Monthly" },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-bold text-[#FDE047]">
                          {item.value}
                        </div>
                        <div className="text-xs text-white/50">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleServicePayment} className="p-8 space-y-4">
                  {/* Input Field */}
                  {[
                    {
                      label: "Full Name",
                      type: "text",
                      key: "name",
                      placeholder: "Enter your name",
                    },
                    {
                      label: "Phone Number",
                      type: "tel",
                      key: "phone",
                      placeholder: "Enter your phone number",
                    },
                    {
                      label: "Email Address",
                      type: "email",
                      key: "email",
                      placeholder: "Enter your email",
                    },
                    {
                      label: "City",
                      type: "text",
                      key: "city",
                      placeholder: "Enter your city",
                    },
                  ].map((field, i) => (
                    <div key={i}>
                      <label className="block text-xs text-white/60 mb-1">
                        {field.label}
                      </label>

                      <input
                        type={field.type}
                        required
                        value={serviceForm[field.key]}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            [field.key]: e.target.value,
                          })
                        }
                        className="
                    w-full px-4 py-3 text-sm rounded-xl
                    bg-white/[0.05] border border-white/10
                    text-white placeholder-white/40
                    focus:outline-none focus:ring-2 focus:ring-[#FDE047]
                    transition-all
                  "
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}

                  {/* Plan Select */}
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Select Franchise Plan
                    </label>

                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="
                  w-full px-4 py-3 text-sm rounded-xl
                  bg-white/[0.05] border border-white/10
                  text-white
                  focus:outline-none focus:ring-2 focus:ring-[#FDE047]
                "
                    >
                      <option className="text-black" value="premium">
                        Business Excellence Plan - ₹5,00,000 + GST
                      </option>
                    </select>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Investment:</span>
                      <span className="text-white font-medium">
                        ₹{investmentAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-white/60">
                      <span>GST (18%):</span>
                      <span className="text-white font-medium">
                        ₹{gstAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-semibold border-t border-white/10 pt-2">
                      <span className="text-white">Total:</span>
                      <span className="text-[#FDE047]">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* GST */}
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      GST Number (Optional)
                    </label>

                    <input
                      type="text"
                      value={serviceForm.gstNumber}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          gstNumber: e.target.value,
                        })
                      }
                      className="
                  w-full px-4 py-3 text-sm rounded-xl
                  bg-white/[0.05] border border-white/10
                  text-white placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-[#FDE047]
                "
                      placeholder="Enter GST number"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className=" cursor-pointer
                w-full py-4 rounded-xl font-semibold text-black
                bg-[#FDE047]
                hover:bg-white hover:scale-[1.02]
                transition-all duration-300
                shadow-[0_0_20px_rgba(253,224,71,0.35)]
              "
                  >
                    Pay ₹{totalAmount.toLocaleString()} Now
                  </button>
                </form>
              </>
            ) : (
              /* Success */
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>

                <h3 className="text-3xl font-semibold text-white mb-4">
                  Application Submitted 🎉
                </h3>

                <p className="text-white/60 mb-6">
                  Our team will contact you within 24 hours.
                </p>

                <div className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl text-left space-y-2 text-sm text-white/70">
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FDE047]" />
                    Application review
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FDE047]" />
                    Free consultation call
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FDE047]" />
                    Franchise onboarding
                  </div>
                </div>

                <div className="mt-6 text-white/50 text-sm flex justify-center items-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  Check your phone/email
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== HERO SECTION =================== */}
      <section
        className="relative w-full py-24 px-6 overflow-hidden font-[Inter]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Back to Home Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-[#FDE047] transition-colors border border-white/10 hover:border-[#FDE047] px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">
              Back to Home
            </span>
          </Link>
        </div>

        {/* Ambient Background Glows */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FDE047] rounded-full blur-[150px] opacity-[0.07]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[150px] opacity-[0.05]" />
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          {/* Chip Label */}
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-[#FDE047]/30 bg-[#FDE047]/5">
            <span className="w-2 h-2 rounded-full bg-[#FDE047] animate-pulse" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#FDE047]">
              Limited Franchise Slots Available
            </span>
          </div>

          {/* Headline */}
          <h1
            className="uppercase leading-[1] tracking-tight text-white font-semibold"
            style={{
              fontSize: "clamp(3rem, 7vw, 6rem)",
            }}
          >
            Build Your Own <br />
            <span className="text-[#FDE047]">AI Business Empire</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-normal">
            Partner with Limbu.ai - India's #1 AI-Powered Google My Business
            Management Platform.
          </p>

          {/* Stats Grid */}
          <div className="flex flex-wrap justify-center gap-6 pt-8">
            {[
              { val: "₹2.5L+", label: "Monthly Potential" },
              { val: "100%", label: "Recurring Revenue" },
              { val: "Zero", label: "Tech Skills Needed" },
            ].map((stat, i) => (
              <div
                key={i}
                className="px-8 py-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm"
              >
                <div className="text-3xl md:text-4xl font-semibold text-white mb-1">
                  {stat.val}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <button
              onClick={() => handleOpenForm()}
              className="bg-[#FDE047] text-black font-semibold px-10 py-4 rounded-xl hover:bg-white transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_30px_rgba(253,224,71,0.3)] cursor-pointer"
            >
              Start Your Franchise <ArrowRight size={20} />
            </button>
            <button
              onClick={() => handleOpenForm()}
              className="bg-transparent border border-white/20 text-white px-10 py-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer font-medium"
            >
              Watch Success Stories
            </button>
          </div>
        </div>
      </section>

      {/* =================== TRUST BADGES =================== */}
      <section
        className="py-10 border-b border-white/10"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { value: "1000+", label: "Active Businesses" },
              { value: "50+", label: "Cities Covered" },
              { value: "98%", label: "Success Rate" },
              { value: "4.9/5", label: "Partner Rating" },
            ].map((item, i) => (
              <div
                key={i}
                className="text-center px-6 py-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-[#FDE047]/40 transition-all duration-300"
              >
                {/* Value */}
                <div className="text-2xl md:text-3xl font-semibold text-[#FDE047] mb-1">
                  {item.value}
                </div>

                {/* Label */}
                <div className="text-xs md:text-sm uppercase tracking-widest text-white/50">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== ABOUT LIMBU.AI =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Glow Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.06] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              What is <span className="text-[#FDE047]">Limbu.ai?</span>
            </h2>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              The most advanced AI-powered Google My Business automation
              platform helping businesses dominate local search
            </p>
          </div>

          {/* Unique Layout */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* LEFT BIG CARD */}
            <div className="md:col-span-2 group p-10 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#FDE047]/40 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FDE047]/10 flex items-center justify-center">
                  <Zap className="text-[#FDE047] w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    AI Auto-Posting
                  </h3>
                  <p className="text-white/60 max-w-md">
                    Generate, optimize, and schedule Google My Business posts
                    automatically using powerful AI workflows — saving hours
                    daily.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT SMALL CARD */}
            <div className="group p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#FDE047]/40 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#FDE047]/10 flex items-center justify-center mb-4">
                <Users className="text-[#FDE047] w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Multi-Location
              </h3>
              <p className="text-white/60 text-sm">
                Manage unlimited locations from a single dashboard.
              </p>
            </div>

            {/* 3 SMALL CARDS */}
            {[
              {
                icon: Star,
                title: "Smart Review Replies",
                desc: "AI responds instantly with human-like replies",
              },
              {
                icon: BarChart,
                title: "Growth Analytics",
                desc: "Track performance & ROI in real-time",
              },
              {
                icon: Target,
                title: "Lead Generation",
                desc: "Convert search traffic into real customers",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#FDE047]/40 hover:scale-105 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[#FDE047]/10 flex items-center justify-center mb-4">
                  <item.icon className="text-[#FDE047] w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}

            {/* LAST WIDE CARD */}
            <div className="md:col-span-3 group p-10 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] backdrop-blur-md hover:border-[#FDE047]/40 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FDE047]/10 flex items-center justify-center">
                  <Shield className="text-[#FDE047] w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Brand Protection
                  </h3>
                  <p className="text-white/60 max-w-2xl">
                    Monitor reviews, detect negative sentiment, and protect your
                    business reputation 24/7 with AI-powered insights and
                    alerts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== WHY FRANCHISE WITH US =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Why Choose{" "}
              <span className="text-[#FDE047]">Limbu.ai Franchise?</span>
            </h2>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              We provide everything you need to build a successful AI business
            </p>
          </div>

          {/* Layout */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Rocket,
                title: "Booming Market",
                desc: "Local SEO market growing at 40% annually in India",
              },
              {
                icon: DollarSign,
                title: "Recurring Revenue",
                desc: "100% monthly recurring income from subscriptions",
              },
              {
                icon: Shield,
                title: "Zero Risk",
                desc: "Proven business model with guaranteed support",
              },
              {
                icon: Users,
                title: "Huge Demand",
                desc: "Every local business needs GMB optimization",
              },
              {
                icon: Zap,
                title: "AI Automation",
                desc: "90% of work handled by AI - minimal effort required",
              },
              {
                icon: Award,
                title: "Exclusive Rights",
                desc: "Limited franchises per city - less competition",
              },
              {
                icon: TrendingUp,
                title: "High Margins",
                desc: "60-70% profit margins on every client",
              },
              {
                icon: Clock,
                title: "Flexible Hours",
                desc: "Work from anywhere, anytime at your own pace",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="
            group p-6 rounded-2xl 
            bg-white/[0.03] 
            border border-white/10 
            backdrop-blur-md 
            hover:border-[#FDE047]/40 
            hover:scale-105 
            hover:shadow-[0_0_30px_rgba(253,224,71,0.15)]
            transition-all duration-300
          "
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#FDE047]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="text-[#FDE047] w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>

                {/* Desc */}
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== COMPLETE BENEFITS PACKAGE =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-[#FDE047] blur-[150px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-600 blur-[150px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Complete{" "}
              <span className="text-[#FDE047]">Franchise Support Package</span>
            </h2>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              Everything you need to succeed — training, tools, marketing &
              ongoing support
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Complete Training Program",
                items: [
                  "5-day comprehensive onboarding",
                  "Product mastery workshops",
                  "Sales & pitching training",
                  "Digital marketing crash course",
                  "Live Q&A sessions",
                ],
              },
              {
                icon: Gift,
                title: "Marketing Materials",
                items: [
                  "Professional brochures & flyers",
                  "Social media content templates",
                  "Email campaign templates",
                  "Video presentation decks",
                  "Branded merchandise kit",
                ],
              },
              {
                icon: Target,
                title: "Sales Support",
                items: [
                  "Proven sales scripts",
                  "Client presentation templates",
                  "Pricing strategy guide",
                  "Objection handling manual",
                  "Lead generation strategies",
                ],
              },
              {
                icon: Users,
                title: "Dedicated Dashboard",
                items: [
                  "Franchise management portal",
                  "Client onboarding system",
                  "Revenue tracking tools",
                  "Performance analytics",
                  "Commission calculator",
                ],
              },
              {
                icon: HeadphonesIcon,
                title: "Ongoing Support",
                items: [
                  "24/7 technical support",
                  "Dedicated account manager",
                  "Monthly strategy calls",
                  "Franchise community access",
                  "Regular product updates",
                ],
              },
              {
                icon: Award,
                title: "Growth Incentives",
                items: [
                  "Performance-based bonuses",
                  "Top performer recognition",
                  "Exclusive expansion rights",
                  "Annual reward programs",
                  "Leadership opportunities",
                ],
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="
            group p-8 rounded-3xl 
            bg-white/[0.03] 
            border border-white/10 
            backdrop-blur-md 
            hover:border-[#FDE047]/40 
            hover:shadow-[0_0_40px_rgba(253,224,71,0.15)]
            transition-all duration-300
          "
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#FDE047]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="text-[#FDE047] w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-4">
                  {benefit.title}
                </h3>

                {/* List */}
                <ul className="space-y-3">
                  {benefit.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#FDE047] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-white/60 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== SUCCESS STORIES =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Real <span className="text-[#FDE047]">Success Stories</span>
            </h2>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              Hear from our successful franchise partners across India
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Rajesh Kumar",
                city: "Mumbai",
                revenue: "₹1.2L/month",
                clients: 85,
                time: "10 months",
                quote:
                  "Started with zero tech knowledge. Now managing 85+ businesses and earning more than my corporate job!",
              },
              {
                name: "Priya Sharma",
                city: "Bangalore",
                revenue: "₹95K/month",
                clients: 62,
                time: "8 months",
                quote:
                  "The AI does all the heavy lifting. I just focus on building relationships with local businesses.",
              },
              {
                name: "Amit Patel",
                city: "Ahmedabad",
                revenue: "₹1.8L/month",
                clients: 120,
                time: "14 months",
                quote:
                  "Best business decision ever! Now planning to expand to 2 more cities with my earnings.",
              },
            ].map((story, i) => (
              <div
                key={i}
                className="
            group p-8 rounded-3xl 
            bg-white/[0.03] 
            border border-white/10 
            backdrop-blur-md 
            hover:border-[#FDE047]/40 
            hover:shadow-[0_0_40px_rgba(253,224,71,0.15)]
            transition-all duration-300
          "
              >
                {/* Profile */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#FDE047]/10 flex items-center justify-center text-[#FDE047] text-xl font-semibold">
                    {story.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{story.name}</div>
                    <div className="text-sm text-white/50">{story.city}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div>
                    <div className="text-xs text-white/50">Monthly Revenue</div>
                    <div className="text-lg font-semibold text-[#FDE047]">
                      {story.revenue}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/50">Active Clients</div>
                    <div className="text-lg font-semibold text-[#FDE047]">
                      {story.clients}
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-white/70 italic mb-4 leading-relaxed">
                  “{story.quote}”
                </p>

                {/* Journey */}
                <div className="text-sm text-white/50 mb-3">
                  Journey: {story.time}
                </div>

                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-[#FDE047] text-[#FDE047]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== WHO CAN APPLY =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden font-[Inter]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Who Can Become a{" "}
              <span className="text-[#FDE047]">Franchise Partner?</span>
            </h2>
          </div>

          {/* Layout */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* LEFT - PERFECT FOR */}
            <div
              className="
          group p-8 rounded-3xl 
          bg-white/[0.03] 
          border border-white/10 
          backdrop-blur-md 
          hover:border-[#FDE047]/40 
          hover:shadow-[0_0_40px_rgba(253,224,71,0.15)]
          transition-all duration-300
        "
            >
              <h3 className="text-2xl font-semibold text-[#FDE047] mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Perfect For
              </h3>

              <ul className="space-y-3">
                {[
                  "Digital marketing professionals",
                  "Sales & business development experts",
                  "Entrepreneurs looking for recurring revenue",
                  "Retired professionals seeking second income",
                  "Anyone with local business connections",
                  "Stay-at-home parents wanting flexible income",
                  "Corporate employees wanting side business",
                  "Recent graduates with entrepreneurial spirit",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#FDE047] mt-0.5 flex-shrink-0" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT - REQUIREMENTS */}
            <div
              className="
          group p-8 rounded-3xl 
          bg-white/[0.03] 
          border border-white/10 
          backdrop-blur-md 
          hover:border-[#FDE047]/40 
          hover:shadow-[0_0_40px_rgba(253,224,71,0.15)]
          transition-all duration-300
        "
            >
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#FDE047]" />
                Requirements
              </h3>

              <ul className="space-y-3">
                {[
                  "Basic computer & internet skills",
                  "Good communication abilities",
                  "Entrepreneurial mindset",
                  "Commitment to growth",
                  "Initial investment capability",
                  "Time: 3-4 hours daily (flexible)",
                  "Smartphone & laptop",
                  "Willingness to learn",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#FDE047] mt-0.5 flex-shrink-0" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* BOTTOM HIGHLIGHT CARD */}
          <div
            className="
        mt-12 p-8 md:p-10 rounded-3xl 
        border border-[#FDE047]/30 
        bg-[#FDE047]/5 
        backdrop-blur-md
        hover:shadow-[0_0_40px_rgba(253,224,71,0.2)]
        transition-all duration-300
      "
          >
            <div className="flex items-start gap-4">
              <Star className="w-8 h-8 text-[#FDE047] mt-1" />

              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                  No Technical Skills Required!
                </h3>

                <p className="text-white/70 leading-relaxed">
                  Our AI platform handles all the technical work. You focus on
                  connecting with local businesses and building relationships.
                  We provide complete training on sales, marketing, and client
                  management so you can scale confidently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== HOW IT WORKS =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden font-[Inter]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              How to <span className="text-[#FDE047]">Get Started</span>
            </h2>
            <p className="text-lg md:text-xl text-white/60">
              Simple 4-step process to launch your franchise
            </p>
          </div>

          {/* Timeline Container */}
          <div className="relative">
            {/* Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2" />

            {/* Steps */}
            <div className="grid md:grid-cols-4 gap-10 relative">
              {[
                {
                  step: "01",
                  title: "Apply Online",
                  desc: "Fill the franchise application form and schedule a discovery call",
                  icon: Target,
                },
                {
                  step: "02",
                  title: "Get Training",
                  desc: "Complete our 5-day comprehensive training program",
                  icon: BookOpen,
                },
                {
                  step: "03",
                  title: "Setup Business",
                  desc: "Get your dashboard, materials, and start onboarding clients",
                  icon: Rocket,
                },
                {
                  step: "04",
                  title: "Earn & Grow",
                  desc: "Build recurring revenue and scale your franchise business",
                  icon: TrendingUp,
                },
              ].map((item, i) => (
                <div key={i} className="relative group">
                  {/* Connector Dot */}
                  <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-4 h-4 rounded-full bg-[#FDE047] shadow-[0_0_15px_rgba(253,224,71,0.8)]" />
                  </div>

                  {/* Card */}
                  <div
                    className="
                relative z-10 p-8 rounded-3xl 
                bg-white/[0.03] 
                border border-white/10 
                backdrop-blur-md 
                hover:border-[#FDE047]/40 
                hover:shadow-[0_0_40px_rgba(253,224,71,0.15)]
                hover:-translate-y-2
                transition-all duration-300
              "
                  >
                    {/* Step Number */}
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FDE047]/10 flex items-center justify-center text-[#FDE047] text-xl font-semibold">
                      {item.step}
                    </div>

                    {/* Icon */}
                    <item.icon className="w-10 h-10 text-[#FDE047] mx-auto mb-4" />

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white text-center mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/60 text-sm text-center leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== INVESTMENT PLANS =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden font-[Inter]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Choose Your <span className="text-[#FDE047]">Franchise Plan</span>
            </h2>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              Select the plan that fits your investment capacity and growth
              goals
            </p>
          </div>

          {/* Cards */}
          <div className="flex flex-wrap justify-center gap-10">
            {[
              {
                name: "Business Excellence Plan",
                investment: "₹5,00,000 + 18% GST",
                commission: "50% on revenue",
                features: [
                  "Regional franchise rights",
                  "VIP training & mentorship",
                  "Custom marketing campaigns",
                  "Dedicated account manager",
                  "Full white-label solution",
                  "Sub-franchise opportunities",
                  "Priority feature access",
                  "Annual business retreat",
                  "Expansion funding support",
                ],
                potential: "₹1L-3L/month",
                best: "Established entrepreneurs",
                popular: true,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`
            relative w-full md:max-w-md p-8 rounded-3xl 
            bg-white/[0.03] 
            border 
            backdrop-blur-md 
            transition-all duration-300
            ${
              plan.popular
                ? "border-[#FDE047]/50 scale-105 shadow-[0_0_50px_rgba(253,224,71,0.2)]"
                : "border-white/10"
            }
          `}
              >
                {/* Most Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FDE047] text-black px-6 py-2 rounded-full text-xs font-semibold shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {plan.name}
                  </h3>

                  <div className="text-4xl font-bold text-[#FDE047] mb-2">
                    {plan.investment}
                  </div>

                  <div className="text-sm text-white/50">
                    One-time investment
                  </div>
                </div>

                {/* Commission Box */}
                <div className="p-4 rounded-xl mb-6 border border-white/10 bg-white/[0.02] text-center">
                  <div className="text-xs text-white/50 mb-1">
                    Profit Sharing
                  </div>
                  <div className="text-lg font-semibold text-[#FDE047]">
                    {plan.commission}
                  </div>
                </div>

                {/* Potential */}
                <div className="p-4 rounded-xl mb-6 border border-white/10 bg-white/[0.02] text-center">
                  <div className="text-xs text-white/50">Income Potential</div>
                  <div className="text-lg font-semibold text-[#FDE047]">
                    {plan.potential}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#FDE047] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Best For */}
                <div className="text-center mb-6">
                  <div className="text-xs text-white/50 mb-1">Best for:</div>
                  <div className="text-sm font-semibold text-white">
                    {plan.best}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleOpenForm("premium")}
                  className="
              w-full py-4 rounded-xl font-semibold
              bg-[#FDE047] text-black 
              hover:bg-white 
              hover:scale-105
              transition-all duration-300 cursor-pointer
              shadow-[0_0_20px_rgba(253,224,71,0.3)]
            "
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FAQ SECTION =================== */}
      <section
        className="relative py-24 px-6 overflow-hidden font-[Inter]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Frequently Asked <span className="text-[#FDE047]">Questions</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Everything you need to know before starting your franchise journey
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-6">
            {[
              {
                q: "Do I need technical skills to run this franchise?",
                a: "No! Our AI platform handles all technical aspects. You just need basic computer skills and good communication abilities. We provide complete training on everything else.",
              },
              {
                q: "How much time do I need to invest daily?",
                a: "You can start with 3-4 hours daily. As you build your client base and processes, you can scale up or hire a small team.",
              },
              {
                q: "What is the breakeven period?",
                a: "Most partners break even within 4-6 months with consistent effort. Some achieve it faster depending on their network.",
              },
              {
                q: "Can I run this alongside my job?",
                a: "Yes! Many partners start part-time and transition to full-time once revenue grows.",
              },
              {
                q: "What kind of support do you provide?",
                a: "Complete support including training, sales scripts, marketing materials, technical help, and a dedicated account manager.",
              },
              {
                q: "Are there any hidden costs?",
                a: "No hidden costs. You keep 60-70% revenue. Only basic operational expenses apply.",
              },
              {
                q: "Can I hire a team?",
                a: "Yes! Many partners scale by building small teams for sales and support.",
              },
              {
                q: "What if it doesn't work in my city?",
                a: "We provide lead generation support and proven strategies. You can also expand to nearby cities.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="
            group p-6 rounded-2xl 
            bg-white/[0.03] 
            border border-white/10 
            backdrop-blur-md
            transition-all duration-300
            hover:border-[#FDE047]/40 
            hover:shadow-[0_0_25px_rgba(253,224,71,0.15)]
          "
              >
                {/* Question */}
                <h3 className="text-lg md:text-xl font-semibold text-white flex items-start gap-3">
                  <span className="text-[#FDE047]">Q.</span>
                  {faq.q}
                </h3>

                {/* Answer */}
                <p className="text-white/70 mt-3 pl-6 leading-relaxed">
                  <span className="text-[#FDE047] font-semibold">A.</span>{" "}
                  {faq.a}
                </p>

                {/* Bottom Glow Line */}
                <div className="mt-4 h-[1px] w-0 bg-[#FDE047] transition-all duration-500 group-hover:w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FINAL CTA =================== */}
      <section
        className="relative py-28 px-6 overflow-hidden font-[Inter]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.06] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.06] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Main Glass Card */}
          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-10 md:p-16 text-center shadow-[0_0_40px_rgba(255,255,255,0.05)]">
            {/* Badge */}
            <div className="inline-block mb-6 px-6 py-2 rounded-full text-sm font-semibold bg-[#FDE047] text-black shadow-md">
              ⚡ Limited Slots - Only 5 Franchises Per City
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-6xl font-semibold text-white mb-6 leading-tight">
              Ready to Build Your{" "}
              <span className="text-[#FDE047]">AI Business Empire?</span>
            </h2>

            {/* Subtext */}
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-4">
              Join India's fastest-growing AI-powered GMB automation franchise
            </p>

            <p className="text-white/50 max-w-3xl mx-auto mb-10">
              Limited franchise opportunities available in each city. Secure
              your territory before competitors do and start generating
              consistent recurring income.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-6 mb-14">
              <button
                onClick={() => handleOpenForm()}
                className=" cursor-pointer
            px-10 py-5 rounded-xl font-semibold text-lg
            bg-[#FDE047] text-black 
            hover:bg-white 
            hover:scale-105
            transition-all duration-300
            flex items-center gap-2
            shadow-[0_0_25px_rgba(253,224,71,0.35)]
          "
              >
                Apply for Franchise <ArrowRight size={22} />
              </button>

              <button
                onClick={() => handleOpenForm()}
                className=" cursor-pointer
            px-10 py-5 rounded-xl text-lg
            border border-white/20
            bg-white/[0.05]
            backdrop-blur-md
            hover:border-[#FDE047]/40
            hover:scale-105
            transition-all duration-300
            flex items-center gap-2 text-white
          "
              >
                <PhoneCall size={22} /> Free Consultation
              </button>
            </div>

            {/* Stats Section */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { value: "₹1L+", label: "Starting Investment" },
                { value: "40-60%", label: "Your Commission" },
                { value: "100%", label: "Recurring Revenue" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="
              p-6 rounded-2xl 
              bg-white/[0.03] 
              border border-white/10 
              backdrop-blur-md
              hover:border-[#FDE047]/40
              transition-all duration-300
            "
                >
                  <div className="text-3xl font-bold text-[#FDE047] mb-2">
                    {item.value}
                  </div>
                  <div className="text-sm text-white/60">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Contact Section */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-white/50 mb-4">
                Have questions? We're here to help.
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a
                  href="tel:+919289344708"
                  className="flex items-center gap-2 text-white/70 hover:text-[#FDE047] transition"
                >
                  <PhoneCall size={16} /> +91 9289344708
                </a>

                <a
                  href="mailto:info@limbu.ai"
                  className="flex items-center gap-2 text-white/70 hover:text-[#FDE047] transition"
                >
                  📧 info@limbu.ai
                </a>

                <button
                  onClick={() => handleOpenForm()}
                  className="flex items-center gap-2 text-white/70 hover:text-[#FDE047] transition"
                >
                  💬 Live Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />

      <ScrollToTop />

      <BookDemoModal/>
    </div>
  );
}
