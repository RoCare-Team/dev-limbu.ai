"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Video, Zap, Users, AlertCircle } from "lucide-react";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

export default function WebinarPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    selectedDate: new Date().toISOString().split("T")[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedDateObj = new Date(formData.selectedDate);
  const day = selectedDateObj.getDay();

  const isSunday = day === 0;

  // ✅ Dynamic Time Logic
  const webinarTime = day === 5 ? "5:30 PM IST" : "4:00 PM IST";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSunday) {
      setError("We don't host webinars on Sundays.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookDemo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.contact,
          seminarTime: webinarTime, // ✅ dynamic
          selectedDate: formData.selectedDate,
          status: "Not Attended",
        }),
      });

      const result = await response.json();

      if (result.success) {
        const query = new URLSearchParams({
          name: formData.name,
          phone: formData.contact,
          date: formData.selectedDate,
          time: webinarTime,
        }).toString();

        router.push(`/thank-you?${query}`);
      } else {
        setError(result.message || "Something went wrong.");
      }
    } catch {
      setError("Server error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#0B0B0B] text-white">
        {/* Background Glow */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-yellow-400/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-yellow-400/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT */}
          <div className="space-y-6 max-w-xl mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase">
              <Zap size={14} /> Live Masterclass
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
              Grow Your Business With{" "}
              <span className="text-yellow-400">Limbu AI</span>
            </h1>

            <p className="text-white/60 text-base">
              Learn how to automate your Google Business & social media in one session.
            </p>

            <div className="space-y-4 pt-2">
              <Feature
                icon={<Video size={20} />}
                title="Live Demo"
                desc="Create 30 posts in minutes"
              />
              <Feature
                icon={<Users size={20} />}
                title="Q&A Session"
                desc="Ask anything about your business"
              />
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-2xl shadow-xl">

              <h2 className="text-xl font-bold mb-1">Book Your Seat</h2>
              <p className="text-white/40 text-sm mb-6">
                Limited slots available
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg flex gap-2 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                />

                <Input
                  label="WhatsApp Number"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                />

                <div>
                  <label className="text-xs text-white/40 mb-1 block">
                    Select Date
                  </label>
                  <input
                    type="date"
                    name="selectedDate"
                    value={formData.selectedDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg outline-none ${
                      isSunday
                        ? "border-red-500"
                        : "border-white/10 focus:ring-2 focus:ring-yellow-400"
                    }`}
                  />

                  {/* ✅ Friday Hint */}
                  {day === 5 && (
                    <p className="text-yellow-400 text-xs mt-1">
                      Friday special timing: 5:30 PM
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-sm py-1">
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Clock size={16} /> {webinarTime}
                  </span>
                  <span className="text-white/40">Zoom</span>
                </div>

                <button
                  disabled={isSubmitting || isSunday}
                  className="w-full py-3 bg-yellow-400 text-black font-bold rounded-lg hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Book Free Seat"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}

/* COMPONENTS */

function Feature({ icon, title, desc }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="p-2 bg-white/5 rounded-lg text-yellow-400">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-white/40 text-sm">{desc}</p>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs text-white/40 mb-1 block">
        {label}
      </label>
      <input
        {...props}
        required
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
      />
    </div>
  );
}