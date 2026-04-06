"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Video, Zap, Users, AlertCircle } from "lucide-react";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

export default function WebinarPage() {
  const router = useRouter();

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    selectedDate: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Logic ---
  const selectedDateObj = new Date(formData.selectedDate);
  const isSunday = selectedDateObj.getDay() === 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSunday) {
      setError("We don't host webinars on Sundays. Please pick another date.");
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
          seminarTime: "4:00 PM IST",
          selectedDate: formData.selectedDate,
          status: "Not Attended",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to Thank You page with query parameters
        const query = new URLSearchParams({
          name: formData.name,
          phone: formData.contact,
          date: formData.selectedDate,
        }).toString();

        router.push(`/thank-you?${query}`);
      } else {
        setError(result.message || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--cyber-black)] text-white font-sans selection:bg-[#FDE047] selection:text-black">
        {/* Background Glow Decorations */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FDE047]/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FDE047]/5 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Info Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDE047]/10 border border-[#FDE047]/20 text-[#FDE047] text-sm font-bold tracking-widest uppercase">
              <Zap className="w-4 h-4" /> Live Masterclass
            </div>

            <h1 className="text-3xl lg:text-6xl font-extrabold leading-tight">
              Grow Your Business With{" "}
              <span className="text-[#FDE047]">Limbu AI</span>
            </h1>

            <p className="text-xl text-white/60 max-w-lg leading-relaxed">
              Join our expert-led webinar to learn how Limbu.ai automates your
              Google My Business and social media presence effortlessly.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Video className="text-[#FDE047] w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Interactive Live Demo</h3>
                  <p className="text-white/40">
                    Watch us create a month's worth of content in 5 minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Users className="text-[#FDE047] w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Q&A Session</h3>
                  <p className="text-white/40">
                    Get your business-specific questions answered live.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FDE047]/20 to-transparent blur-lg rounded-3xl" />

            <div className="relative bg-[#0F0F0F] border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">
              <h2 className="text-2xl font-bold mb-2">Secure Your Spot</h2>
              <p className="text-white/40 mb-8">
                Limited seats available for the upcoming session.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/30 ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#FDE047] outline-none transition placeholder:text-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/30 ml-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    required
                    placeholder="98765 43210"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#FDE047] outline-none transition placeholder:text-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/30 ml-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    name="selectedDate"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.selectedDate}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition text-white ${isSunday ? "border-red-500" : "focus:ring-2 focus:ring-[#FDE047]"}`}
                  />
                </div>

                <div className="flex items-center justify-between py-2 px-1 text-sm">
                  <div className="flex items-center gap-2 text-[#FDE047] font-semibold">
                    <Clock className="w-4 h-4" /> 4:00 PM IST
                  </div>
                  <div className="text-white/30 italic">Live on Zoom</div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isSunday}
                  className="w-full py-5 bg-[#FDE047] text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(253,224,71,0.15)]"
                >
                  {isSubmitting ? "Processing..." : "Book My Free Seat"}
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
