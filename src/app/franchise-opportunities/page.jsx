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
  Activity,
  Loader2,
  Building2,
  MapPin,
  Mail as MailIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
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

    const investmentAmount = profitCalculations[selectedPlan].investment;
    const gstAmount = Math.round(investmentAmount * 0.18);
    const totalAmount = investmentAmount + gstAmount;

    try {
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
      if (orderData.error) {
        alert("Error creating payment order");
        return;
      }

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
                amount: totalAmount,
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

  const profitCalculations = {
    starter: { investment: 50000 },
    standard: { investment: 100000 },
    premium: { investment: 500000 },
  };

  const investmentAmount = profitCalculations[selectedPlan].investment;
  const gstAmount = Math.round(investmentAmount * 0.18);
  const totalAmount = investmentAmount + gstAmount;

  return (
    <div
      className="relative w-full overflow-hidden m-0 p-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Navbar />

      {/* ── Subtle background grid ── */}
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
          <div className="relative w-full max-w-lg bg-white border border-black/5 rounded-xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Grid Background */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Close Button (Fixed at Top Right) */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 bg-white border border-black/5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-50 transition-all z-20 shadow-sm"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto custom-scroll relative z-10 flex-1">
              {!formSubmitted ? (
                <div>
                  {/* Header */}
                  <div className="p-6 sm:p-8 text-center border-b border-black/5 bg-slate-50/50 pt-10 sm:pt-8">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-sm border border-lemon-glow/20 bg-lemon-glow/10">
                      <span className="w-2 h-2 rounded-full animate-pulse bg-lemon-hover" />
                      <span className="text-[10px] font-black uppercase text-lemon-hover tracking-widest">
                        Limited Intake
                      </span>
                    </div>
                    <h2
                      className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-2"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Partner Application
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                      Initialize your AI business deployment today
                    </p>
                  </div>

                  <form
                    onSubmit={handleServicePayment}
                    className="p-6 sm:p-8 space-y-5"
                  >
                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={serviceForm.name}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-black/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                          placeholder="Registry Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                          Digital Node (Phone)
                        </label>
                        <input
                          type="tel"
                          required
                          value={serviceForm.phone}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-black/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                          placeholder="+91"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Electronic Mail
                      </label>
                      <input
                        type="email"
                        required
                        value={serviceForm.email}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-black/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                        placeholder="address@domain.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                          Target Territory
                        </label>
                        <input
                          type="text"
                          required
                          value={serviceForm.city}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              city: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-black/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                          placeholder="Operation City"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                          GST Identifier
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
                          className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-black/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-black/5 space-y-3 shadow-inner">
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Investment Base:</span>
                        <span className="text-black">
                          ₹{investmentAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Service Tax (18%):</span>
                        <span className="text-black">
                          ₹{gstAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-black/5 pt-3 mt-3">
                        <span className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                          Total Deployment:
                        </span>
                        <span className="text-lg sm:text-xl font-black text-lemon-hover tracking-tight">
                          ₹{totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-lemon w-full py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all"
                    >
                      Initialize Payment ↗
                    </button>
                  </form>
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
      <section className="relative w-full py-20 px-6 sm:py-32">
        {/* Ambient Glows */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] z-0 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at top right, var(--lemon-glow) 0%, transparent 65%)",
          }}
        />

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-lemon-glow/20 bg-lemon-glow/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-lemon-hover">
              Franchise Portal Active
            </span>
          </div>

          <h1
            className="uppercase leading-[0.95] tracking-tight text-black font-black"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Synthesize Your Own <br />
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
              <div
                key={i}
                className="px-10 py-6 rounded-3xl border border-black/5 bg-white shadow-sm hover:shadow-md transition-all"
              >
                <div
                  className="text-3xl sm:text-4xl font-black text-black tracking-tighter mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {stat.val}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <button
              onClick={() => handleOpenForm()}
              className="btn-lemon px-10 py-4.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
            >
              Apply for Deployment{" "}
              <ArrowRight size={16} className="ml-2 inline" />
            </button>
            <button
              onClick={() => handleOpenForm()}
              className="btn-ghost px-10 py-4.5 rounded-xl text-xs font-black uppercase tracking-widest border-black/5"
            >
              System Overview ↗
            </button>
          </div>
        </div>
      </section>

      {/* =================== TRUST SIGNALS =================== */}
      <section className="py-14 border-y border-black/5 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20">
            {[
              { value: "1000+", label: "Active Nodes" },
              { value: "50+", label: "Target Cities" },
              { value: "98%", label: "Retention Rate" },
              { value: "4.9/5", label: "System Rating" },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div
                  className="text-3xl sm:text-4xl font-black text-black tracking-tighter mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
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
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <p className="text-lemon-hover text-xs font-black uppercase tracking-[0.3em] mb-4">
              Core Infrastructure
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              The Limbu AI <span className="text-lemon-hover">Advantage</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 group p-10 rounded-[2.5rem] border border-black/5 bg-white hover:border-lemon-hover/30 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10 flex items-start gap-8">
                <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-lg">
                  <Zap className="text-lemon-glow w-10 h-10" />
                </div>
                <div>
                  <h3
                    className="text-2xl font-black text-black uppercase tracking-tight mb-4"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Automated Deployment
                  </h3>
                  <p className="text-slate-500 text-base font-bold leading-relaxed max-w-md">
                    Execute complex local SEO tasks across unlimited nodes. AI
                    handles posting, optimization, and reporting autonomously.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 rounded-[2.5rem] border border-black/5 bg-white hover:border-lemon-hover/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center mb-6 shadow-sm group-hover:bg-black group-hover:text-lemon-glow transition-all">
                <Users className="w-7 h-7" />
              </div>
              <h3
                className="text-lg font-black text-black uppercase tracking-tight mb-3"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Multi-Node Logic
              </h3>
              <p className="text-slate-500 text-sm font-bold leading-relaxed">
                Manage entire city sectors from a single dashboard interface.
              </p>
            </div>

            {[
              {
                icon: Star,
                title: "Sentiment Shield",
                desc: "Automated review interception and brand protection.",
              },
              {
                icon: BarChart,
                title: "Velocity Reports",
                desc: "Real-time performance metrics and ROI visualization.",
              },
              {
                icon: Target,
                title: "Signal Capture",
                desc: "Convert local search intent into verified business leads.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-8 rounded-[2rem] border border-black/5 bg-white hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center mb-6 shadow-sm">
                  <item.icon className="text-black w-7 h-7" />
                </div>
                <h3
                  className="text-lg font-black text-black uppercase tracking-tight mb-3"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}

            <div className="md:col-span-3 group p-10 rounded-[2.5rem] border border-black/5 bg-slate-50/50 hover:border-black/10 transition-all relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-20 h-20 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0 shadow-sm">
                  <Shield className="text-black w-10 h-10" />
                </div>
                <div>
                  <h3
                    className="text-2xl font-black text-black uppercase tracking-tight mb-4"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Enterprise Security
                  </h3>
                  <p className="text-slate-500 text-base font-bold leading-relaxed max-w-3xl">
                    Protect your portfolio with 24/7 AI-powered monitoring.
                    Detect and neutralize reputation risks before they impact
                    client visibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== WHY JOIN =================== */}
      <section className="relative py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2
              className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Franchise <span className="text-lemon-hover">Protocols</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Rocket,
                title: "Vertical Market",
                desc: "Local SEO demand is accelerating at 40% annually.",
              },
              {
                icon: DollarSign,
                title: "Vault Scaling",
                desc: "Build scalable monthly recurring revenue streams.",
              },
              {
                icon: Shield,
                title: "Verified Model",
                desc: "Zero-risk business architecture with full support.",
              },
              {
                icon: Users,
                title: "Massive Scope",
                desc: "Every local business node requires optimization.",
              },
              {
                icon: Zap,
                title: "AI Automation",
                desc: "90% of operational tasks handled by AI engine.",
              },
              {
                icon: Award,
                title: "Territory Rights",
                desc: "Exclusive operation rights within your sector.",
              },
              {
                icon: TrendingUp,
                title: "High Yield",
                desc: "60-70% operational margins on every client.",
              },
              {
                icon: Clock,
                title: "Flexible Sync",
                desc: "Operate your hub at any time, from any location.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-white border border-black/5 hover:border-lemon-hover/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-lemon-glow transition-all border border-black/5">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3
                  className="text-base font-black text-black uppercase tracking-tight mb-3"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs font-bold leading-relaxed uppercase tracking-wider">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== INVESTMENT =================== */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2
              className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Choose Your <span className="text-lemon-hover">Deployment</span>
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-10">
            <div className="relative w-full md:max-w-lg p-10 sm:p-12 rounded-[3rem] bg-white border border-lemon-hover/30 shadow-2xl scale-105 transition-all">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-lemon-hover text-white px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                Recommended Node
              </div>

              <div className="text-center mb-10 pb-10 border-b border-slate-100 mt-4">
                <h3
                  className="text-2xl font-black text-black uppercase tracking-tight mb-4"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Business Excellence
                </h3>
                <div
                  className="text-5xl font-black text-black tracking-tighter mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  ₹5,00,000
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  + 18% GST • One-Time Fee
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-5 bg-slate-50 rounded-2xl border border-black/5 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Commission
                  </p>
                  <p className="text-sm font-black text-black">50% Revenue</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-black/5 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Potential
                  </p>
                  <p className="text-sm font-black text-black">₹3L / Mo</p>
                </div>
              </div>

              <ul className="space-y-5 mb-10 px-2">
                {[
                  "Regional franchise rights",
                  "VIP training & mentorship",
                  "Custom marketing campaigns",
                  "Dedicated account manager",
                  "Full white-label solution",
                  "Sub-franchise opportunities",
                ].map((feature, j) => (
                  <li key={j} className="flex items-center gap-4">
                    <CheckCircle className="w-5 h-5 text-lemon-hover shrink-0" />
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleOpenForm("premium")}
                className="btn-lemon w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
              >
                Activate Node ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FAQ =================== */}
      <section className="relative py-24 px-6 bg-slate-50/50">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2
              className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Manual <span className="text-lemon-hover">& FAQ</span>
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Is technical expertise required?",
                a: "Negative. Our AI architecture handles all synthesis tasks. You focus on node expansion and relationship management.",
              },
              {
                q: "What is the daily uptime requirement?",
                a: "Partners typically invest 3-4 hours daily. The system is scalable and can be managed by a minimal team.",
              },
              {
                q: "ROI break-even timeline?",
                a: "Standard projections show break-even within 4-6 months of consistent sector deployment.",
              },
              {
                q: "Are there hidden operational costs?",
                a: "Zero. Our model is transparent with 60-70% profit retention on every node.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-white border border-black/5 hover:border-black/10 hover:shadow-md transition-all"
              >
                <h3 className="text-base sm:text-lg font-black text-black flex items-start gap-4 uppercase tracking-tight">
                  <span className="text-lemon-hover mt-0.5">Q.</span> {faq.q}
                </h3>
                <p className="text-sm text-slate-500 font-bold mt-4 pl-8 sm:pl-10 leading-relaxed italic opacity-90">
                  <span className="text-lemon-hover not-italic">A.</span>{" "}
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FINAL CTA =================== */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="bg-white border border-black/5 rounded-[3rem] p-12 md:p-24 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lemon-glow/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="inline-block mb-10 px-6 py-2.5 rounded-full text-[10px] font-black bg-black text-lemon-glow shadow-md uppercase tracking-widest">
                ⚡ Global Territory Availability: Limited
              </div>

              <h2
                className="text-4xl md:text-5xl font-black text-black mb-8 leading-tight uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Start Your AI <br />
                <span className="text-lemon-hover">Empire Today</span>
              </h2>

              <p className="text-slate-500 text-base md:text-lg font-bold uppercase tracking-widest mb-14 opacity-90">
                Secure your territory before sector saturation.
              </p>

              <div className="flex flex-wrap justify-center gap-5 mb-20">
                <button
                  onClick={() => handleOpenForm()}
                  className="btn-lemon px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105"
                >
                  Apply for Franchise{" "}
                  <ArrowRight size={18} className="ml-2 inline" />
                </button>
                <button
                  onClick={() => handleOpenForm()}
                  className="btn-ghost px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest border-black/5 shadow-sm bg-white"
                >
                  <PhoneCall size={18} className="mr-2 inline" /> Consultation
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-12 border-t border-black/5">
                {[
                  {
                    value: "tel:+919289344708",
                    icon: PhoneCall,
                    label: "+91 9289344708",
                  },
                  {
                    value: "mailto:info@limbu.ai",
                    icon: MailIcon,
                    label: "info@limbu.ai",
                  },
                  { value: "#", icon: Activity, label: "Live Deployment Chat" },
                ].map((contact, i) => (
                  <a
                    key={i}
                    href={contact.value}
                    className="flex items-center justify-center gap-3 p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-black/5"
                  >
                    <contact.icon size={18} className="text-lemon-hover" />
                    <span className="text-xs font-black text-black uppercase tracking-tighter">
                      {contact.label}
                    </span>
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

// ---------------- UTILITY COMPONENTS ----------------

function ActivityIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-black/5 hover:border-black/10 transition-all shadow-sm">
      <div className="p-1.5 bg-slate-50 rounded-lg border border-black/5 text-black">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-[10px] font-bold text-black truncate">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-black/5 flex flex-col items-center text-center transition-all hover:bg-white hover:shadow-md">
      <div className="p-1.5 bg-white rounded-lg border border-black/5 text-black mb-2 shadow-sm">
        {icon}
      </div>
      <p className="text-xl font-black text-black tracking-tighter mb-0.5">
        {value}
      </p>
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
        {title}
      </p>
    </div>
  );
}
