"use client";

import {
  HiPhone,
  HiMail,
  HiLocationMarker,
  HiClock,
  HiArrowLeft,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi";

import { useState } from "react";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

/* ─── Validators ─── */
const validatePhone = (v) => /^[6-9]\d{9}$/.test(v.trim());
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const validateName = (v) => /^[A-Za-z\s]{2,40}$/.test(v.trim());

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    consent: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    let value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const name = e.target.name;

    // Real-time filtering
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10); // Numbers only, max 10
    }
    
    if (name === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, ""); // Text only
    }

    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!validateName(formData.name)) newErrors.name = "Enter a valid name (2-40 chars)";
    if (!validateEmail(formData.email)) newErrors.email = "Enter a valid email address";
    if (!validatePhone(formData.phone)) newErrors.phone = "Enter a 10-digit mobile number";
    if (formData.message.trim().length < 10) newErrors.message = "Message must be at least 10 characters";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/contact-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          consent: false,
        });

        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div
        className="min-h-screen py-20 px-4 sm:px-6 relative overflow-hidden"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* ── Subtle background grid ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10 pt-10">

          {/* Back */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 mb-10 text-xs font-bold tracking-widest uppercase transition-colors hover:text-[var(--lemon-hover)] text-slate-400 cursor-pointer"
          >
            <HiArrowLeft /> Back to Home
          </button>

          {/* ── Section Header ── */}
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(250, 204, 21, 0.1)",
                border: "1px solid rgba(250, 204, 21, 0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--lemon-hover)" }} />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--lemon-hover)" }}>
                Contact Studio
              </span>
            </div>

            {/* Headline - Slightly Smaller */}
            <h1
              className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--foreground)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
              }}
            >
              Get In <span style={{ color: "var(--lemon-hover)" }}>Touch</span>
            </h1>

            <p
              className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-semibold"
              style={{ color: "rgba(15, 23, 42, 0.6)" }}
            >
              Have questions? Our team of experts is ready to help you navigate your digital transformation journey.
            </p>
          </div>

          {/* Alerts */}
          {submitStatus === "success" && (
            <div className="mb-8 p-5 bg-green-50 border border-green-100 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-4">
              <HiCheckCircle className="text-green-500 text-2xl shrink-0" />
              <div>
                <p className="text-green-800 font-bold text-sm uppercase tracking-tight">
                  Message sent successfully!
                </p>
                <p className="text-green-600/80 text-xs font-semibold mt-1">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-4">
              <HiExclamationCircle className="text-red-500 text-2xl shrink-0" />
              <div>
                <p className="text-red-800 font-bold text-sm uppercase tracking-tight">
                  Submission Failed
                </p>
                <p className="text-red-600/80 text-xs font-semibold mt-1">
                  Something went wrong. Please check your network or email us directly.
                </p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* FORM CARD */}
            <div 
              className="bg-white border rounded-3xl p-8 sm:p-10 transition-shadow duration-500 hover:shadow-2xl"
              style={{
                borderColor: "rgba(15, 23, 42, 0.08)",
                boxShadow: "0 20px 40px -15px rgba(0,0,0,0.03)"
              }}
            >
              <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-8" style={{ fontFamily: "var(--font-heading)" }}>
                Drop us a message
              </h2>

              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className={`input ${errors.name ? 'border-red-400 ring-1 ring-red-100' : ''}`}
                  />
                  {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-tight">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className={`input ${errors.email ? 'border-red-400 ring-1 ring-red-100' : ''}`}
                  />
                  {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-tight">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    className={`input ${errors.phone ? 'border-red-400 ring-1 ring-red-100' : ''}`}
                  />
                  {errors.phone && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-tight">{errors.phone}</p>}
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Your Message</label>
                  <textarea
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    className={`input resize-none ${errors.message ? 'border-red-400 ring-1 ring-red-100' : ''}`}
                  />
                  {errors.message && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-tight">{errors.message}</p>}
                </div>

                {/* Consent */}
                <div className="flex gap-3 text-xs font-semibold text-slate-500 py-2">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    className="mt-0.5 accent-[var(--lemon-hover)] w-4 h-4 shrink-0"
                  />
                  <span>I agree to receive communications from Limbu AI regarding my inquiry.</span>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.consent}
                  className="w-full py-4 rounded-2xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:hover:scale-100 mt-4"
                  style={{
                    background: "var(--lemon-hover)",
                    color: "#fff",
                    boxShadow: "0 10px 20px -5px rgba(234, 179, 8, 0.3)",
                  }}
                >
                  {isSubmitting ? "Processing..." : "Send Message ↗"}
                </button>
              </div>
            </div>

            {/* INFO SECTION */}
            <div className="space-y-6">
              {[
                {
                  icon: <HiPhone />,
                  title: "Call Us Directly",
                  value: "+91 9289344726",
                  desc: "Available Mon-Sat, 9AM-7PM"
                },
                {
                  icon: <HiMail />,
                  title: "Email Inquiry",
                  value: "info@limbu.ai",
                  desc: "Response within 12 hours"
                },
                {
                  icon: <HiLocationMarker />,
                  title: "Our Studio",
                  value: "Gurugram, Haryana",
                  desc: "India's Tech Hub"
                },
                {
                  icon: <HiClock />,
                  title: "Working Hours",
                  value: "9:00 AM – 7:00 PM",
                  desc: "Monday through Saturday"
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-3xl bg-white border border-slate-100 flex gap-6 items-center transition-all duration-300 hover:border-[var(--lemon-hover)]/30 hover:shadow-xl hover:-translate-y-1"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-colors group-hover:bg-[var(--lemon-hover)] group-hover:text-white"
                    style={{ 
                      background: "rgba(250, 204, 21, 0.1)", 
                      color: "var(--lemon-hover)" 
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-lg font-bold text-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                      {item.value}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}

              {/* Promo Card */}
              <div 
                className="p-8 rounded-3xl bg-slate-950 text-white overflow-hidden relative"
              >
                <div className="relative z-10">
                  <h3 className="text-xl text-white font-bold uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Ready to scale?
                  </h3>
                  <p className="text-white/60 text-sm font-medium mb-6">
                    Join 500+ businesses growing with Limbu AI automation.
                  </p>
                  <a href="/signup" className="text-xs font-bold uppercase tracking-widest text-[var(--lemon-glow)] hover:underline">
                    Get started now →
                  </a>
                </div>
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--lemon-hover)] opacity-10 blur-3xl -mr-10 -mt-10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}
