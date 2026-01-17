"use client";

import { ArrowRight, CheckCircle, Star, PhoneCall, TrendingUp, Users, DollarSign, Award, Shield, Zap, BarChart, Target, Rocket, Clock, HeadphonesIcon, BookOpen, Gift, X, Sparkles, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function FranchisePage() {
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [showForm, setShowForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    gstNumber: ""
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
          setServiceForm(prev => ({
            ...prev,
            name: data.fullName || '',
            phone: data.phone || '',
            email: data.email || '',
            gstNumber: data.gst || ''
          }));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    } else {
      setServiceForm(prev => ({
        ...prev,
        name: '',
        phone: '',
        email: '',
        gstNumber: ''
      }));
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
    
    if (!serviceForm.name || !serviceForm.phone || !serviceForm.email || !serviceForm.city) {
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
            user_email: serviceForm.email
          }
        }),
      });

      const orderData = await orderRes.json();
      if (orderData.error) {
        alert("Error creating payment order");
        return;
      }

      // 2. Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_RwX1nRfZbVyVwT",
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
                status: "paid"
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
                  gstNumber: ""
                });
              }, 3000);
            } else {
              const data = await res.json();
              alert(data.message || "Something went wrong. Please try again.");
            }
          } catch (error) {
            console.error("Error submitting form:", error);
            alert("Failed to submit application. Please check your connection.");
          }
        },
        prefill: {
          name: serviceForm.name,
          email: serviceForm.email,
          contact: serviceForm.phone
        },
        theme: {
          color: "#2563EB"
        }
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
      platformFeePercent: 50
    },
    standard: {
      clients: 50,
      revenue: 60,
      investment: 100000,
      monthly: 37500,
      yearly: 450000,
      profitPercent: 40,
      platformFeePercent: 40
    },
    premium: {
      clients: 100,
      revenue: 50,
      investment: 200000,
      monthly: 90000,
      yearly: 1080000,
      profitPercent: 50,
      platformFeePercent: 30
    }
  };

  // Reactive amount calculations for UI
  const investmentAmount = profitCalculations[selectedPlan].investment;
  const gstAmount = Math.round(investmentAmount * 0.18);
  const totalAmount = investmentAmount + gstAmount;

  return (
    <div className="w-full bg-gray-50 text-gray-900">
      
      {/* =================== APPLICATION FORM MODAL =================== */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-slideUp">
            {/* Close Button */}
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            >
              <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
            </button>

            {!formSubmitted ? (
              <>
                {/* Form Header */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-t-3xl">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Limited Slots Available
                    </div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">
                    Start Your Franchise Journey
                  </h2>
                  <p className="text-center text-blue-100 text-lg">
                    Fill the form below and our team will contact you within 24 hours
                  </p>
                  
                  {/* Trust Indicators */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">500+</div>
                      <div className="text-xs text-blue-200">Active Partners</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-xs text-blue-200">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">₹2.5L+</div>
                      <div className="text-xs text-blue-200">Avg. Monthly</div>
                    </div>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleServicePayment} className="p-8 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
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
                      onChange={(e) => setServiceForm({ ...serviceForm, phone: e.target.value })}
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
                      onChange={(e) => setServiceForm({ ...serviceForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={serviceForm.city}
                      onChange={(e) => setServiceForm({ ...serviceForm, city: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      placeholder="Enter your city"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Select Franchise Plan</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      <option value="premium">Business Excellence Plan - ₹2,00,000 + GST</option>
                    </select>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 my-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Investment Amount:</span>
                        <span className="font-semibold text-slate-800">₹{investmentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">GST (18%):</span>
                        <span className="font-semibold text-slate-800">₹{gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2 mt-2">
                        <span className="text-slate-800">Total Payable:</span>
                        <span className="text-blue-600">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={serviceForm.gstNumber}
                      onChange={(e) => setServiceForm({ ...serviceForm, gstNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      placeholder="Enter GST number"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-[1.02] mt-2 text-sm"
                  >
                    Pay ₹{totalAmount.toLocaleString()} Now
                  </button>
                </form>
              </>
            ) : (
              /* Success Message */
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  Application Submitted Successfully! 🎉
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Thank you for your interest in Limbu.ai Franchise!
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl mb-6">
                  <p className="text-gray-700 mb-3">
                    <strong className="text-blue-600">What's Next?</strong>
                  </p>
                  <ul className="text-left space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Our team will review your application within 24 hours
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      We'll schedule a FREE discovery call with you
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Get detailed insights about the franchise opportunity
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <PhoneCall className="w-5 h-5" />
                  <span className="text-sm">Check your email and phone for updates</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== HERO SECTION =================== */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-24 px-6 overflow-hidden">
        <div className="absolute top-6 left-6 z-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-pink-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-full font-bold text-sm mb-4">
            🚀 Limited Franchise Slots Available
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            Build Your Own <span className="text-yellow-300">AI Business Empire</span>
          </h1>
          
          <p className="text-xl md:text-2xl opacity-90 max-w-4xl mx-auto">
            Partner with Limbu.ai - India's #1 AI-Powered Google My Business Management Platform
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-lg">
              <div className="text-3xl font-bold">₹2.5L+</div>
              <div className="text-sm opacity-80">Monthly Potential</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-lg">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm opacity-80">Recurring Revenue</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-lg">
              <div className="text-3xl font-bold">Zero</div>
              <div className="text-sm opacity-80">Tech Skills Needed</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button 
              onClick={() => handleOpenForm()}
              className="bg-yellow-400 text-black font-bold px-8 py-4 rounded-full hover:bg-yellow-300 transition-all hover:scale-105 flex items-center gap-2 shadow-2xl"
            >
              Start Your Franchise <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => handleOpenForm()}
              className="bg-white/20 border-2 border-white px-8 py-4 rounded-full hover:bg-white/30 transition-all backdrop-blur-md"
            >
              Watch Success Stories
            </button>
          </div>
        </div>
      </section>

      {/* =================== TRUST BADGES =================== */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1000+</div>
              <div className="text-sm">Active Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">50+</div>
              <div className="text-sm">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">98%</div>
              <div className="text-sm">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.9/5</div>
              <div className="text-sm">Partner Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== ABOUT LIMBU.AI =================== */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What is <span className="text-blue-600">Limbu.ai?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most advanced AI-powered Google My Business automation platform helping businesses dominate local search
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "AI Auto-Posting", desc: "Generate and schedule GMB posts automatically using AI" },
              { icon: Users, title: "Multi-Location Management", desc: "Manage unlimited business locations from one dashboard" },
              { icon: Star, title: "Smart Review Replies", desc: "AI responds to reviews in seconds with personalized messages" },
              { icon: BarChart, title: "Growth Analytics", desc: "Track performance, insights, and ROI in real-time" },
              { icon: Target, title: "Lead Generation", desc: "Convert more searches into customers automatically" },
              { icon: Shield, title: "Brand Protection", desc: "Monitor and protect business reputation 24/7" }
            ].map((item, i) => (
              <div key={i} className="group p-8 bg-white rounded-3xl shadow-lg border-2 border-gray-100 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <item.icon className="text-blue-600 group-hover:text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

   

      {/* =================== WHY FRANCHISE WITH US =================== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-blue-600">Limbu.ai Franchise?</span>
            </h2>
            <p className="text-xl text-gray-600">
              We provide everything you need to build a successful AI business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Rocket,
                title: "Booming Market",
                desc: "Local SEO market growing at 40% annually in India",
                color: "blue"
              },
              {
                icon: DollarSign,
                title: "Recurring Revenue",
                desc: "100% monthly recurring income from subscriptions",
                color: "green"
              },
              {
                icon: Shield,
                title: "Zero Risk",
                desc: "Proven business model with guaranteed support",
                color: "purple"
              },
              {
                icon: Users,
                title: "Huge Demand",
                desc: "Every local business needs GMB optimization",
                color: "orange"
              },
              {
                icon: Zap,
                title: "AI Automation",
                desc: "90% of work handled by AI - minimal effort required",
                color: "yellow"
              },
              {
                icon: Award,
                title: "Exclusive Rights",
                desc: "Limited franchises per city - less competition",
                color: "red"
              },
              {
                icon: TrendingUp,
                title: "High Margins",
                desc: "60-70% profit margins on every client",
                color: "indigo"
              },
              {
                icon: Clock,
                title: "Flexible Hours",
                desc: "Work from anywhere, anytime at your own pace",
                color: "pink"
              }
            ].map((item, i) => (
              <div key={i} className="group p-6 bg-gray-50 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                <div className={`bg-${item.color}-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`text-${item.color}-600 w-7 h-7`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== COMPLETE BENEFITS PACKAGE =================== */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-blue-700 text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Complete <span className="text-yellow-300">Franchise Support Package</span>
            </h2>
            <p className="text-xl opacity-90">
              Everything you need to succeed - training, tools, marketing & ongoing support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Complete Training Program",
                items: [
                  "5-day comprehensive onboarding",
                  "Product mastery workshops",
                  "Sales & pitching training",
                  "Digital marketing crash course",
                  "Live Q&A sessions"
                ]
              },
              {
                icon: Gift,
                title: "Marketing Materials",
                items: [
                  "Professional brochures & flyers",
                  "Social media content templates",
                  "Email campaign templates",
                  "Video presentation decks",
                  "Branded merchandise kit"
                ]
              },
              {
                icon: Target,
                title: "Sales Support",
                items: [
                  "Proven sales scripts",
                  "Client presentation templates",
                  "Pricing strategy guide",
                  "Objection handling manual",
                  "Lead generation strategies"
                ]
              },
              {
                icon: Users,
                title: "Dedicated Dashboard",
                items: [
                  "Franchise management portal",
                  "Client onboarding system",
                  "Revenue tracking tools",
                  "Performance analytics",
                  "Commission calculator"
                ]
              },
              {
                icon: HeadphonesIcon,
                title: "Ongoing Support",
                items: [
                  "24/7 technical support",
                  "Dedicated account manager",
                  "Monthly strategy calls",
                  "Franchise community access",
                  "Regular product updates"
                ]
              },
              {
                icon: Award,
                title: "Growth Incentives",
                items: [
                  "Performance-based bonuses",
                  "Top performer recognition",
                  "Exclusive expansion rights",
                  "Annual reward programs",
                  "Leadership opportunities"
                ]
              }
            ].map((benefit, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border-2 border-white/20 hover:bg-white/20 transition-all">
                <benefit.icon className="w-12 h-12 text-yellow-300 mb-4" />
                <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                <ul className="space-y-2">
                  {benefit.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                      <span className="text-sm opacity-90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== SUCCESS STORIES =================== */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Real <span className="text-blue-600">Success Stories</span>
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our successful franchise partners across India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Rajesh Kumar",
                city: "Mumbai",
                revenue: "₹1.2L/month",
                clients: 85,
                time: "10 months",
                quote: "Started with zero tech knowledge. Now managing 85+ businesses and earning more than my corporate job!"
              },
              {
                name: "Priya Sharma",
                city: "Bangalore",
                revenue: "₹95K/month",
                clients: 62,
                time: "8 months",
                quote: "The AI does all the heavy lifting. I just focus on building relationships with local businesses."
              },
              {
                name: "Amit Patel",
                city: "Ahmedabad",
                revenue: "₹1.8L/month",
                clients: 120,
                time: "14 months",
                quote: "Best business decision ever! Now planning to expand to 2 more cities with my earnings."
              }
            ].map((story, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-xl border-2 border-gray-100 hover:border-blue-500 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {story.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{story.name}</div>
                    <div className="text-sm text-gray-600">{story.city}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-xl">
                  <div>
                    <div className="text-sm text-gray-600">Monthly Revenue</div>
                    <div className="text-lg font-bold text-blue-600">{story.revenue}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Clients</div>
                    <div className="text-lg font-bold text-blue-600">{story.clients}</div>
                  </div>
                </div>

                <p className="text-gray-700 italic mb-3">"{story.quote}"</p>
                <div className="text-sm text-gray-500">Journey: {story.time}</div>
                
                <div className="flex gap-1 mt-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== WHO CAN APPLY =================== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Who Can Become a <span className="text-blue-600">Franchise Partner?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 border-2 border-green-200 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-2">
                <CheckCircle className="w-7 h-7" />
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
                  "Recent graduates with entrepreneurial spirit"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                <Award className="w-7 h-7" />
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
                  "Willingness to learn"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 p-8 rounded-3xl mt-8">
            <div className="flex items-start gap-4">
              <Star className="w-8 h-8 text-yellow-600 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Technical Skills Required!</h3>
                <p className="text-gray-700">
                  Our AI platform handles all the technical work. You focus on connecting with local businesses and building relationships. We provide complete training on sales, marketing, and client management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== HOW IT WORKS =================== */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How to <span className="text-blue-600">Get Started</span>
            </h2>
            <p className="text-xl text-gray-600">
              Simple 4-step process to launch your franchise
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Apply Online",
                  desc: "Fill the franchise application form and schedule a discovery call",
                  icon: Target
                },
                {
                  step: "02",
                  title: "Get Training",
                  desc: "Complete our 5-day comprehensive training program",
                  icon: BookOpen
                },
                {
                  step: "03",
                  title: "Setup Business",
                  desc: "Get your dashboard, materials, and start onboarding clients",
                  icon: Rocket
                },
                {
                  step: "04",
                  title: "Earn & Grow",
                  desc: "Build recurring revenue and scale your franchise business",
                  icon: TrendingUp
                }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-100 hover:border-blue-500 transition-all hover:scale-105">
                    <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 mx-auto">
                      {item.step}
                    </div>
                    <item.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-center">{item.title}</h3>
                    <p className="text-gray-600 text-center">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== INVESTMENT PLANS =================== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-blue-600">Franchise Plan</span>
            </h2>
            <p className="text-xl text-gray-600">
              Select the plan that fits your investment capacity and growth goals
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {[
              // {
              //   name: "Business Champion",
              //   investment: "₹50,000",
              //   originalPrice: "₹1,00,000",
              //   commission: "30%",
              //   features: [
              //     "City-level franchise rights",
              //     "Complete training program",
              //     "Marketing material kit",
              //     "Dedicated support",
              //     "Franchise dashboard access",
              //     "Sales scripts & templates",
              //     "Monthly strategy calls"
              //   ],
              //   potential: "₹25K-1L/month",
              //   best: "New entrepreneurs"
              // },
           
              {
                name: "Business Excellence Plan",
                investment: "₹2,00,000",
                originalPrice: "₹5,00,000",
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
                  "Expansion funding support"
                ],
                // target: "100+ clients",
                potential: "₹50k-3L/month",
                best: "Established entrepreneurs",
                                popular: true

              },
              //    {
              //   name: "Business Growth Plan",
              //   investment: "₹1,00,000",
              //   originalPrice: "₹2,00,000",
              //   commission: "40% on revenue + 10% Business Champion",
              //   features: [
              //     "Multi-city franchise rights",
              //     "Priority training & support",
              //     "Premium marketing materials",
              //     "Lead generation support",
              //     "Advanced dashboard features",
              //     "Quarterly business reviews",
              //     "White-label options",
              //     "Team building guidance"
              //   ],
              //   // target: "50/-80 clients",
              //   potential: "₹50K-2L/month",
              //   best: "Growth-focused partners",
              // },
            ].map((plan, i) => (
              <div key={i} className={`relative bg-white rounded-3xl shadow-2xl border-2 p-8 w-full md:max-w-md ${plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  {plan.originalPrice && (
                    <div className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-2 animate-pulse">
                      🎉 New Year Offer
                    </div>
                  )}
                  {plan.originalPrice && (
                    <div className="text-lg text-gray-400 line-through font-bold decoration-red-500 decoration-2">
                      {plan.originalPrice}
                    </div>
                  )}
                  <div className="text-4xl font-bold text-blue-600 mb-2">{plan.investment}</div>
                  <div className="text-sm text-gray-600">One-time investment</div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Profit Sharing</div>
                    <div className="text-lg font-bold text-green-600 leading-tight">{plan.commission}</div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {/* <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Target Clients</div>
                    <div className="font-bold text-blue-600">{plan.target}</div>
                  </div> */}
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Income Potential</div>
                    <div className="font-bold text-purple-600">{plan.potential}</div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center mb-6">
                  <div className="text-xs text-gray-500 mb-2">Best for:</div>
                  <div className="text-sm font-semibold text-gray-700">{plan.best}</div>
                </div>

                <button 
                  onClick={() => handleOpenForm("premium")}
                  className={`w-full py-4 rounded-full font-bold transition-all ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>

          {/* <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-2xl mt-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <Gift className="w-8 h-8 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Limited Time Offer!</h3>
                <p className="text-gray-700">
                  Apply before Dec 31, 2025 and get <strong>₹10,000 worth of bonus marketing materials</strong> + Free advanced sales training worth ₹15,000. Plus, first 50 partners get exclusive city rights!
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </section>

      {/* =================== FAQ SECTION =================== */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked <span className="text-blue-600">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Do I need technical skills to run this franchise?",
                a: "No! Our AI platform handles all technical aspects. You just need basic computer skills and good communication abilities. We provide complete training on everything else."
              },
              {
                q: "How much time do I need to invest daily?",
                a: "You can start with 3-4 hours daily. As you build your client base and processes, you can scale up or hire a small team. Many partners work part-time initially."
              },
              {
                q: "What is the breakeven period?",
                a: "Most partners break even within 4-6 months with consistent effort. Some achieve it faster depending on their network and sales skills."
              },
              {
                q: "Can I run this alongside my job?",
                a: "Yes! Many of our partners started part-time. The flexible schedule allows you to work evenings and weekends initially, then transition to full-time as revenue grows."
              },
              {
                q: "What kind of support do you provide?",
                a: "Complete support including training, sales scripts, marketing materials, technical support, dedicated account manager, and access to our franchise community."
              },
              {
                q: "Are there any hidden costs or monthly fees?",
                a: "No hidden costs! You keep 60-70% of client payments (based on your plan). No monthly franchise fees. You only pay your operational costs like internet and marketing."
              },
              {
                q: "Can I hire a team to scale my business?",
                a: "Absolutely! Many successful partners build teams of 2-5 people to handle sales, onboarding, and client support, allowing them to scale beyond 100+ clients."
              },
              {
                q: "What if the business doesn't work in my city?",
                a: "We carefully evaluate each city's potential before approving franchises. We also provide lead generation support and proven strategies. Plus, you can expand to nearby cities."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:border-blue-500 transition-all">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-start gap-2">
                  <span className="text-blue-600">Q:</span> {faq.q}
                </h3>
                <p className="text-gray-700 pl-6">
                  <span className="text-green-600 font-bold">A:</span> {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FINAL CTA =================== */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-pink-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-full font-bold text-sm mb-6">
            ⚡ Limited Slots - Only 5 Franchises Per City
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Ready to Build Your <span className="text-yellow-300">AI Business Empire?</span>
          </h2>

          <p className="text-xl md:text-2xl opacity-90 mb-4">
            Join India's fastest-growing AI-powered GMB automation franchise
          </p>

          <p className="text-lg opacity-80 mb-10 max-w-3xl mx-auto">
            Limited franchise opportunities available in each city. Secure your territory before your competitors do. Start earning ₹50K-2.5L+ monthly recurring income.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <button 
              onClick={() => handleOpenForm()}
              className="bg-yellow-400 text-black px-10 py-5 rounded-full text-xl font-bold hover:bg-yellow-300 transition-all hover:scale-110 flex items-center gap-2 shadow-2xl"
            >
              Apply for Franchise Now <ArrowRight size={24} />
            </button>

            <button 
              onClick={() => handleOpenForm()}
              className="bg-white/20 border-2 border-white px-10 py-5 rounded-full text-xl hover:bg-white/30 transition-all backdrop-blur-md flex items-center gap-2"
            >
              <PhoneCall size={24} /> Schedule Free Consultation
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
              <div className="text-3xl font-bold mb-2">₹50K</div>
              <div className="text-sm opacity-90">Starting Investment</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
              <div className="text-3xl font-bold mb-2">40-60%</div>
              <div className="text-sm opacity-90">Your Commission</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-sm opacity-90">Recurring Revenue</div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm opacity-75 mb-4">Have questions? We're here to help!</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-yellow-300 transition">
                <PhoneCall size={16} /> +91 9289344708
              </a>
              <a href="mailto:info@limbu.ai" className="flex items-center gap-2 hover:text-yellow-300 transition">
                📧 info@limbu.ai
              </a>
              <button onClick={() => handleOpenForm()} className="flex items-center gap-2 hover:text-yellow-300 transition">
                💬 Live Chat Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FOOTER =================== */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">Limbu.ai</h3>
              <p className="text-gray-400 text-sm">
                India's most advanced AI-powered Google My Business management platform.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Franchise</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => handleOpenForm()} className="hover:text-white transition">Apply Now</button></li>
                <li><a href="#" className="hover:text-white transition">Benefits</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
                <li><a href="#" className="hover:text-white transition">FAQs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📞 +91 9289344708</li>
                <li>📧 info@limbu.ai</li>
                <li>📍 Gurugram, India</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Limbu.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}