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
        className="min-h-screen py-20 px-6 font-[Inter] relative overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">

          {/* Back */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white/60 hover:text-[#FDE047] mb-8"
          >
            <HiArrowLeft /> Back
          </button>

          {/* Heading */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Get In <span className="text-[#FDE047]">Touch</span>
            </h1>
            <p className="text-white/60 max-w-xl mx-auto">
              Have questions? We’re here to help you grow your business.
            </p>
          </div>

          {/* Alerts */}
          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3">
              <HiCheckCircle className="text-green-400 text-2xl" />
              <div>
                <p className="text-green-300 font-semibold">
                  Message sent successfully!
                </p>
                <p className="text-green-400 text-sm">
                  We'll contact you soon.
                </p>
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
              <HiExclamationCircle className="text-red-400 text-2xl" />
              <div>
                <p className="text-red-300 font-semibold">
                  Something went wrong
                </p>
                <p className="text-red-400 text-sm">
                  Please try again later.
                </p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-10">

            {/* FORM */}
            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl p-8 rounded-3xl">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Send Message
              </h2>

              <div className="space-y-4">

                {/* Name */}
                <input
                  type="text"
                  name="name"
                  required
                  minLength={3}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="input"
                />

                {/* Email */}
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="input"
                />

                {/* Phone */}
                <input
                  type="tel"
                  name="phone"
                  required
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10 digit phone number"
                  className="input"
                />

                {/* Message */}
                <textarea
                  name="message"
                  required
                  minLength={10}
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your Message"
                  className="input resize-none"
                />

                {/* Consent */}
                <div className="flex gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  I agree to be contacted
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.consent}
                  className="
                    w-full py-4 rounded-xl font-semibold
                    bg-[#FDE047] text-black
                    hover:bg-white hover:scale-[1.02]
                    transition-all
                    disabled:opacity-50
                  "
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>

            {/* INFO */}
            <div className="space-y-6">
              {[
                {
                  icon: <HiPhone />,
                  title: "Phone",
                  value: "+91 9289344726",
                },
                {
                  icon: <HiMail />,
                  title: "Email",
                  value: "info@limbu.ai",
                },
                {
                  icon: <HiLocationMarker />,
                  title: "Address",
                  value: "Gurugram, Haryana",
                },
                {
                  icon: <HiClock />,
                  title: "Hours",
                  value: "Mon–Sat: 9AM–7PM",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4 items-center hover:border-[#FDE047]/40 transition"
                >
                  <div className="text-[#FDE047] text-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}