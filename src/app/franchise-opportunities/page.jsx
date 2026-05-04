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
  X,
  Mail as MailIcon,
} from "lucide-react";
import { useState, useCallback } from "react";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import ScrollToTop from "@/components/ui/ScrollToTop";
import BookDemoModal from "@/components/modals/WebinarBooking";

// ✅ Moved OUTSIDE component so it's never undefined
const PROFIT_CALCULATIONS = {
  starter: { investment: 50000 },
  standard: { investment: 100000 },
  premium: { investment: 500000 },
};

// ✅ Fixed: checks if script already loaded before injecting again
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.onload = () => resolve(true);
      existing.onerror = () => resolve(false);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function FranchisePage() {
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [createdFranchiseId, setCreatedFranchiseId] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    gstNumber: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Derive amounts from selectedPlan directly — always in sync
  const investmentAmount = PROFIT_CALCULATIONS[selectedPlan]?.investment ?? 0;
  const gstAmount = Math.round(investmentAmount * 0.18);
  const totalAmount = investmentAmount + gstAmount;

  const handleOpenForm = async (plan = null) => {
    const resolvedPlan = plan || selectedPlan;
    setSelectedPlan(resolvedPlan);
    setShowForm(true);
    setFormStep(1); // Reset to step 1
    setFormSubmitted(false);

    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const res = await fetch(`/api/auth/signup?userId=${userId}`);
        const data = await res.json();
        if (data && !data.error) {
          setServiceForm((prev) => ({
            ...prev,
            name: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            gstNumber: data.GstNumber || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();

    if (!serviceForm.name || !serviceForm.phone || !serviceForm.email || !serviceForm.city) {
      alert("Please fill all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Save data as a lead FIRST
      const res = await fetch("/api/franchise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...serviceForm,
          plan: selectedPlan,
          investment: investmentAmount,
          status: "pending",
          leadType: "Website", // Force Lead Type
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCreatedFranchiseId(data.data._id);
        setFormStep(2); // Successfully created lead, move to payment step
      } else {
        alert(data.message || "Something went wrong saving your details.");
      }
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Failed to submit details. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleServicePayment = async () => {
    setIsLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsLoading(false);
        return;
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          amount: totalAmount,
          receipt: `franchise_${Date.now()}`,
          notes: {
            plan_name: selectedPlan,
            user_email: serviceForm.email,
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || orderData.error || !orderData.order) {
        alert("Error creating payment order: " + (orderData.error || "Server Error"));
        setIsLoading(false);
        return;
      }

      const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!RAZORPAY_KEY) {
        alert("Payment configuration missing. Please contact support.");
        setIsLoading(false);
        return;
      }

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Limbu.ai Franchise",
        description: `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan Franchise Fee`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Step 2: Update the created lead's status to paid
            const submitRes = await fetch("/api/franchise", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: createdFranchiseId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: totalAmount,
                status: "paid",
              }),
            });

            if (submitRes.ok) {
              setFormSubmitted(true);
              setTimeout(() => {
                setShowForm(false);
                setFormSubmitted(false);
                setFormStep(1);
                setServiceForm({ name: "", phone: "", email: "", city: "", gstNumber: "" });
              }, 3000);
            } else {
              const data = await submitRes.json();
              alert(data.message || "Payment recorded but failed to update status.");
            }
          } catch (error) {
            console.error("Error submitting form:", error);
            alert("Payment received but failed to update application status.");
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
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

      paymentObject.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        alert("Payment failed: " + (response.error?.description || "Unknown error"));
        setIsLoading(false);
      });

      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to initiate payment: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden m-0 p-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Navbar />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* =================== APPLICATION FORM MODAL =================== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-black/5 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 bg-white border border-black/5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-50 transition-all z-20 shadow-sm"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="overflow-y-auto custom-scroll relative z-10 flex-1">
              {!formSubmitted ? (
                <div>
                  <div className="p-6 sm:p-8 text-center border-b border-black/5 bg-slate-50/50 pt-10 sm:pt-8 relative">
                    {/* Add a back button for step 2 */}
                    {formStep === 2 && (
                      <button
                        onClick={() => setFormStep(1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-full transition-all"
                      >
                        <X className="w-4 h-4 rotate-45 sm:w-5 sm:h-5 text-slate-500" />
                      </button>
                    )}
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-sm border border-lemon-glow/20 bg-lemon-glow/10">
                      <span className="w-2 h-2 rounded-full animate-pulse bg-lemon-hover" />
                      <span className="text-[10px] font-black uppercase text-lemon-hover tracking-widest">
                        {formStep === 1 ? "Step 1: Your Details" : "Step 2: Payment Summary"}
                      </span>
                    </div>
                    <h2
                      className="text-xl sm:text-2xl font-black text-black uppercase tracking-normal leading-tight mb-2"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Partner Application
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                      Initialize your AI business deployment today
                    </p>
                  </div>

                  {/* conditionally render form based on formStep */}
                  {formStep === 1 ? (
                    <form onSubmit={handleProceedToPayment} className="p-6 sm:p-8 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            Your Name
                          </label>
                          <input
                            type="text"
                            required
                            value={serviceForm.name}
                            onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                            className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={serviceForm.phone}
                            onChange={(e) => setServiceForm({ ...serviceForm, phone: e.target.value })}
                            className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                            placeholder="Enter 10-digit mobile number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={serviceForm.email}
                          onChange={(e) => setServiceForm({ ...serviceForm, email: e.target.value })}
                          className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                          placeholder="Enter your email address"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            Your City
                          </label>
                          <input
                            type="text"
                            required
                            value={serviceForm.city}
                            onChange={(e) => setServiceForm({ ...serviceForm, city: e.target.value })}
                            className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                            placeholder="Which city are you from?"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            GST Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={serviceForm.gstNumber}
                            onChange={(e) => setServiceForm({ ...serviceForm, gstNumber: e.target.value })}
                            className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                            placeholder="Enter GST number if you have one"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-lemon w-full py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isLoading ? "Saving Details..." : "Proceed to Next ↗"}
                      </button>
                    </form>
                  ) : (
                    <div className="p-6 sm:p-8 space-y-5">
                      {/* ✅ Payment summary — always shows correct amounts */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span>Franchise Fee:</span>
                          <span className="text-black">₹{investmentAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span>GST (18%):</span>
                          <span className="text-black">₹{gstAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
                          <span className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                            Total Amount:
                          </span>
                          <span className="text-lg sm:text-xl font-black text-lemon-hover tracking-tight">
                            ₹{totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleServicePayment}
                        disabled={isLoading}
                        className="btn-lemon w-full py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isLoading ? "Processing..." : "Pay Now ↗"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 sm:p-16 text-center flex flex-col justify-center min-h-[400px]">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce shadow-sm">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                  </div>
                  <h3
                    className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Application Received
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    Our deployment team will reach out within 24 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================== HERO SECTION =================== */}
      <section className="relative w-full py-12 px-6 sm:py-20">
        <div
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] z-0 opacity-10"
          style={{
            background: "radial-gradient(ellipse at top right, var(--lemon-glow) 0%, transparent 65%)",
          }}
        />
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-lemon-glow/20 bg-lemon-glow/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />
            <span className="text-[10px] font-black tracking-widest uppercase text-lemon-hover">
              Franchise Portal Active
            </span>
          </div>

          <h1
            className="uppercase leading-[1.15] tracking-normal text-black font-black"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontFamily: "var(--font-heading)" }}
          >
            Build Your Own <br />
            <span className="text-lemon-hover">AI Business Empire</span>
          </h1>

          <p className="text-sm md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-widest opacity-90">
            India's #1 AI-Powered Google My Business Infrastructure.
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-10">
            {[
              { val: "₹2.5L+", label: "Monthly Target" },
              { val: "100%", label: "Recurring Model" },
              { val: "Zero", label: "Technical Overhead" },
            ].map((stat, i) => (
              <div key={i} className="px-10 py-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="text-3xl sm:text-4xl font-black text-black tracking-tighter mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.val}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <button
              onClick={() => handleOpenForm("premium")}
              className="btn-lemon px-10 py-4.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
            >
              Apply Now <ArrowRight size={16} className="ml-2 inline" />
            </button>
          </div>
        </div>
      </section>

      {/* =================== TRUST SIGNALS =================== */}
      <section className="py-8 border-y border-slate-200 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20">
            {[
              { value: "1000+", label: "Happy Partners" },
              { value: "50+", label: "Cities Covered" },
              { value: "98%", label: "Success Rate" },
              { value: "4.9/5", label: "User Rating" },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="text-3xl sm:text-4xl font-black text-black tracking-tighter mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.value}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black group-hover:text-lemon-hover transition-colors">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== ARCHITECTURE =================== */}
      <section className="relative py-12 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <p className="text-lemon-hover text-xs font-black uppercase tracking-widest mb-4">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-normal leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              The Limbu AI <span className="text-lemon-hover">Advantage</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 group p-10 rounded-[2.5rem] border border-slate-200 bg-white hover:border-lemon-hover/50 hover:shadow-xl transition-all duration-500 relative overflow-hidden shadow-sm">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10 flex items-start gap-8">
                <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-lg">
                  <Zap className="text-lemon-glow w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    Fully Automated
                  </h3>
                  <p className="text-slate-500 text-base font-bold leading-relaxed max-w-md">
                    Our AI does the heavy lifting. It automatically posts updates, manages reviews, and creates reports so you don't have to.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 rounded-[2.5rem] border border-slate-200 bg-white hover:border-lemon-hover/50 hover:shadow-xl transition-all duration-500 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:bg-black group-hover:text-lemon-glow transition-all">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-black uppercase tracking-tight mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Easy Management
              </h3>
              <p className="text-slate-500 text-sm font-bold leading-relaxed">
                Control all your clients from one simple, easy-to-use dashboard.
              </p>
            </div>

            {[
              { icon: Star, title: "Manage Reviews", desc: "Automatically track and reply to customer feedback." },
              { icon: BarChart, title: "Clear Reports", desc: "See exact results and growth with easy-to-read charts." },
              { icon: Target, title: "Get More Leads", desc: "Turn online searches into real paying customers." },
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-[2rem] border border-slate-200 bg-white hover:border-lemon-hover/50 hover:shadow-xl transition-all shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                  <item.icon className="text-black w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed">{item.desc}</p>
              </div>
            ))}

            <div className="md:col-span-3 group p-10 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden shadow-sm">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <Shield className="text-black w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    Safe & Secure
                  </h3>
                  <p className="text-slate-500 text-base font-bold leading-relaxed max-w-3xl">
                    Your business and your clients' data are completely protected with top-level security monitoring 24/7.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== WHY JOIN =================== */}
      <section className="relative py-12 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-normal leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Franchise <span className="text-lemon-hover">Benefits</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Rocket, title: "Growing Market", desc: "Every local business needs to be found online today." },
              { icon: DollarSign, title: "Steady Income", desc: "Earn money every month from your active clients." },
              { icon: Shield, title: "Proven System", desc: "A completely safe business model with full training." },
              { icon: Users, title: "Big Opportunity", desc: "Thousands of businesses need this exact service." },
              { icon: Zap, title: "Powered by AI", desc: "Our smart system does 90% of the hard work for you." },
              { icon: Award, title: "Your Territory", desc: "You get exclusive rights to operate in your area." },
              { icon: TrendingUp, title: "High Profits", desc: "Keep a large percentage of the revenue you make." },
              { icon: Clock, title: "Work Anywhere", desc: "Run your business from home or anywhere you like." },
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-white border border-slate-200 hover:border-lemon-hover/50 hover:shadow-xl transition-all duration-300 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-lemon-glow transition-all border border-slate-200">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-black uppercase tracking-tight mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs font-bold leading-relaxed uppercase tracking-wider">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== INVESTMENT =================== */}
      <section className="relative py-12 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-normal leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Choose Your <span className="text-lemon-hover">Plan</span>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            <div className="relative w-full md:max-w-lg p-10 sm:p-12 rounded-[3rem] bg-white border-2 border-lemon-hover/40 shadow-2xl scale-105 transition-all hover:border-lemon-hover/60 hover:shadow-[0_20px_50px_-12px_rgba(234,179,8,0.25)]">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-lemon-hover text-white px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
              <div className="text-center mb-10 pb-10 border-b border-slate-100 mt-4">
                <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  Premium Franchise
                </h3>
                <div className="text-5xl font-black text-black tracking-tighter mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  ₹5,00,000
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">+ 18% GST • One-Time Fee</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Your Share</p>
                  <p className="text-sm font-black text-black">50% Revenue</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Earning Potential</p>
                  <p className="text-sm font-black text-black">₹1-3L / Month</p>
                </div>
              </div>
              <ul className="space-y-5 mb-10 px-2">
                {[
                  "Exclusive rights in your city",
                  "Full personal training",
                  "Ready-made marketing materials",
                  "Dedicated support manager",
                  "Run under your own brand",
                  "Option to add sub-partners",
                ].map((feature, j) => (
                  <li key={j} className="flex items-center gap-4">
                    <CheckCircle className="w-5 h-5 text-lemon-hover shrink-0" />
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenForm("premium")}
                className="btn-lemon w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
              >
                Choose This Plan ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FAQ =================== */}
      <section className="relative py-12 px-6 bg-slate-50/50">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-normal leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Frequently Asked <span className="text-lemon-hover">Questions</span>
            </h2>
          </div>
          <div className="space-y-6">
            {[
              { q: "Do I need to be good with computers?", a: "Not at all. Our AI system does the hard technical work. You just focus on talking to local businesses." },
              { q: "How much time do I need to give?", a: "Most partners spend about 3-4 hours a day. It's very flexible and fits around your schedule." },
              { q: "When will I make my money back?", a: "If you follow our system, most partners make their investment back in 4 to 6 months." },
              { q: "Are there any hidden fees?", a: "No. You pay the franchise fee once, and after that, you keep a large share of the monthly profits." },
            ].map((faq, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all shadow-sm">
                <h3 className="text-base sm:text-lg font-black text-black flex items-start gap-4 uppercase tracking-tight">
                  <span className="text-lemon-hover mt-0.5">Q.</span> {faq.q}
                </h3>
                <p className="text-sm text-slate-500 font-bold mt-4 pl-8 sm:pl-10 leading-relaxed italic opacity-90">
                  <span className="text-lemon-hover not-italic">A.</span> {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FINAL CTA =================== */}
      <section className="relative py-12 px-6">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-12 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lemon-glow/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="inline-block mb-10 px-6 py-2.5 rounded-full text-[10px] font-black bg-black text-lemon-glow shadow-md uppercase tracking-widest">
                ⚡ Limited Spots Available
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-black mb-8 leading-tight uppercase tracking-normal" style={{ fontFamily: "var(--font-heading)" }}>
                Start Your Business <br />
                <span className="text-lemon-hover">With Us Today</span>
              </h2>
              <p className="text-slate-500 text-base md:text-lg font-bold uppercase tracking-widest mb-14 opacity-90">
                Book your city before someone else does.
              </p>
              <div className="flex flex-wrap justify-center gap-5 mb-20">
                <button
                  onClick={() => handleOpenForm("premium")}
                  className="btn-lemon px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105"
                >
                  Apply Now <ArrowRight size={18} className="ml-2 inline" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-12 border-t border-slate-200">
                {[
                  { value: "tel:+919289344726", icon: PhoneCall, label: "+91 9289344726" },
                  { value: "mailto:info@limbu.ai", icon: MailIcon, label: "info@limbu.ai" },
                ].map((contact, i) => (
                  <a key={i} href={contact.value} className="flex items-center justify-center gap-3 p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                    <contact.icon size={18} className="text-lemon-hover" />
                    <span className="text-xs font-black text-black uppercase tracking-tighter">{contact.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
      <ScrollToTop />
      <BookDemoModal />
    </div>
  );
}