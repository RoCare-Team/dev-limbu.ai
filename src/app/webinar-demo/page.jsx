"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Video, Zap, Users, AlertCircle, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
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
      setError("Webinars are not scheduled on Sundays. Please select another date.");
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
    <div className="relative w-full overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Navbar />
      
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[600px] h-[500px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, var(--lemon-glow) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-stretch">
        
        {/* Left Side: Info Content */}
        <div className="bg-white/40 backdrop-blur-sm border border-black/5 p-8 sm:p-12 rounded-[2.5rem] flex flex-col justify-between shadow-sm">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lemon-glow/20 bg-lemon-glow/10 shadow-sm w-fit">
              <span className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-lemon-hover">
                Scale Your Business
              </span>
            </div>

            <div className="space-y-6">
              <h1 
                className="font-black uppercase text-3xl leading-[0.95] tracking-tight text-black"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Dominating Local <br/><span className="text-lemon-hover">Search Markets</span>
              </h1>
              
              <div className="space-y-4">
                <p className="text-base sm:text-lg font-bold text-black uppercase tracking-tight leading-snug">
                  Unlock the full potential of your Google Business Profile with <span className="text-lemon-hover">Limbu AI</span>.
                </p>
                <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                  Join our exclusive live session to witness how top-tier businesses are automating 100% of their local presence, capturing verified customer signals, and scaling revenue without technical overhead.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                {[
                  "Automated Content Synthesis",
                  "Verified Sentiment Protection",
                  "AI-Driven Review Intelligence",
                  "Multi-Node Performance Scaling"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-lemon-glow flex items-center justify-center border border-black/5 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-[11px] font-black text-black uppercase tracking-widest">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 mt-12 pt-8 border-t border-black/5">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform">
                <Video className="text-lemon-glow w-5 h-5" />
              </div>
              <p className="text-xs text-black font-black uppercase tracking-tight leading-tight">
                Masterclass <br/><span className="text-slate-400 font-bold tracking-widest text-[9px]">Live Demonstration</span>
              </p>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                <Users className="text-black w-5 h-5" />
              </div>
              <p className="text-xs text-black font-black uppercase tracking-tight leading-tight">
                Limbu Experts <br/><span className="text-slate-400 font-bold tracking-widest text-[9px]">Live Intelligence Sync</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="relative">
          <div className="relative bg-white border border-black/5 p-8 sm:p-12 rounded-[3rem] shadow-2xl h-full flex flex-col justify-center">
            <div className="text-center mb-10">
              <div className="inline-block p-4 bg-slate-50 rounded-2xl border border-black/5 mb-6">
                <Zap className="w-8 h-8 text-lemon-hover fill-lemon-hover" />
              </div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)" }}>Secure Your Slot</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Intake Pipeline</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-bold uppercase tracking-widest">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Full Registry Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Registry Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  WhatsApp Uplink
                </label>
                <input
                  type="tel"
                  name="contact"
                  required
                  placeholder="98765 43210"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Target Sync Date
                </label>
                <input
                  type="date"
                  name="selectedDate"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.selectedDate}
                  onChange={handleInputChange}
                  className={`w-full px-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-xs font-bold outline-none transition-all ${isSunday ? "border-red-400 focus:ring-red-400" : "focus:ring-2 focus:ring-lemon-glow"}`}
                />
              </div>

              <div className="flex items-center justify-between py-4 px-1">
                <div className="flex items-center gap-2 text-lemon-hover font-black text-xs uppercase tracking-widest">
                  <Clock className="w-4 h-4" /> 4:00 PM IST
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-black text-[10px] uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" /> Cloud Node
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSunday}
                className="btn-lemon w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Syncing..." : "Initialize Free Booking ↗"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
