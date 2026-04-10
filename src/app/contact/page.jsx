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

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async () => {
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

        {/* ── Ambient glow — top right ── */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">

          {/* Back */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 mb-10 text-xs font-bold tracking-widest uppercase transition-colors hover:text-[var(--lemon-hover)] text-slate-400 cursor-pointer"
          >
            <HiArrowLeft /> Back to Home
          </button>

          {/* ── Section Header ── */}
          <div className="text-center mb-16">
            {/* Label chip */}
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

            {/* Headline */}
            <h1
              className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--foreground)",
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
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
                  Something went wrong on our end. Please try again later or email us directly.
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
                    required
                    minLength={3}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="input"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="input"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    pattern="[0-9]{10}"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    className="input"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Your Message</label>
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    className="input resize-none"
                  />
                </div>

                {/* Consent */}
                <div className="flex gap-3 text-xs font-semibold text-slate-500 py-2">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    className="mt-0.5 accent-[var(--lemon-hover)] w-4 h-4"
                  />
                  <span>I agree to receive communications from Limbu AI regarding my inquiry.</span>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.consent}
                  className="w-full py-4 rounded-2xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:hover:scale-100 mt-4"
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

              {/* Social or Extra Card */}
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
