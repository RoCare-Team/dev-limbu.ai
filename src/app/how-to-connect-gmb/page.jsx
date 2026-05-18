"use client";

import { MessageCircle, LogIn, Globe, PlusSquare, ShieldCheck, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import Link from "next/link";

export default function HowToConnectGMB() {
  const steps = [
    {
      icon: Globe,
      title: "Log into Google in your Browser",
      desc: "Before starting, ensure you are logged into your web browser (Chrome, Safari, etc.) with the exact Gmail address that manages your Google My Business profile. This ensures a seamless connection.",
      alert: "Crucial Step: Must be the admin/owner email of the GMB profile.",
      actionLabel: "Open Google.com",
      actionLink: "https://myaccount.google.com/",
      isExternal: true,
    },
    {
      icon: LogIn,
      title: "Log into Limbu AI",
      desc: "Go to the Limbu AI portal and log into your account using your credentials to access your personalized workspace.",
      actionLabel: "Go to Login Page",
      actionLink: "/login",
      isExternal: false,
    },
    {
      icon: PlusSquare,
      title: "Click the Plus (+) Icon on Dashboard",
      desc: "Once logged in, navigate to your main Dashboard. Look for the 'Add Google Account' section and click on the Plus (+) icon to initiate the connection.",
      actionLabel: "Go to Dashboard",
      actionLink: "/dashboard",
      isExternal: false,
    },
    {
      icon: ShieldCheck,
      title: "Continue with Google",
      desc: "Click the 'Continue with Google' button. A secure Google popup will appear. Select the email address you logged into during Step 1 and grant Limbu AI the required permissions to manage your profile.",
    },
    {
      icon: MapPin,
      title: "Select Your Business Location",
      desc: "After successful authorization, Limbu AI will fetch your business profiles. Simply select your specific business location, and you are all set to start automating!",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden">
      {/* ── Navbar ── */}
      <HeaderSection />

      {/* ── Ambient Backgrounds ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] z-0 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* ── Floating WhatsApp Button ── */}
      <a
        href="https://wa.me/917065178662?text=Hi%20Limbu%20AI,%20I%20need%20help%20connecting%20my%20GMB%20account."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 p-3 pr-5 bg-[#25D366] text-white rounded-full shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)] hover:scale-105 hover:shadow-[0_15px_40px_-10px_rgba(37,211,102,0.8)] transition-all duration-300"
      >
        <MessageCircle size={24} />
        <span className="text-[12px] font-bold uppercase tracking-wider hidden sm:block">
          Need Help?
        </span>
      </a>

      {/* Reduced py- spacing here */}
      <main className="flex-1 relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-16 w-full">
        
        {/* ── Hero Section ── */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--lemon-hover)" }} />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--lemon-hover)" }}>
              Integration Guide
            </span>
          </div>

          {/* Smaller Headings */}
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--cyber-black)" }}>
            How to Connect Your <br/>
            <span style={{ color: "var(--lemon-hover)" }}>Google Business</span> Profile
          </h1>

          <p className="text-sm font-medium text-black/60 max-w-xl mx-auto leading-relaxed font-inter">
            Follow these simple steps to securely link your Google My Business account to Limbu AI and unlock powerful AI-driven automation.
          </p>
        </div>

        {/* ── Step-by-Step Timeline ── */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-lemon-glow/20 hidden md:block" />

          {/* Reduced space between steps */}
          <div className="space-y-6 md:space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col md:flex-row gap-5 md:gap-8 group">
                
                {/* Step Number & Icon (Desktop) */}
                <div className="hidden md:flex flex-col items-center z-10">
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-lemon-glow shadow-md shadow-lemon-glow/20 flex items-center justify-center text-[#eab308] group-hover:scale-110 group-hover:bg-[#eab308] group-hover:text-black transition-all duration-300">
                    <step.icon size={20} />
                  </div>
                  <div className="mt-3 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-black/40">
                    0{index + 1}
                  </div>
                </div>

                {/* Step Content Card - Reduced padding */}
                <div className="flex-1 bg-slate-50 border border-black/5 rounded-3xl p-5 md:p-8 hover:shadow-xl hover:shadow-lemon-glow/5 hover:-translate-y-1 transition-all duration-300">
                  {/* Mobile Header */}
                  <div className="flex items-center gap-3 mb-3 md:hidden">
                    <div className="w-10 h-10 rounded-lg bg-lemon-glow text-black flex items-center justify-center shadow-sm">
                      <step.icon size={18} />
                    </div>
                    <span className="text-[10px] font-black text-black/40 tracking-widest uppercase">
                      Step 0{index + 1}
                    </span>
                  </div>

                  {/* Smaller step title */}
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--cyber-black)" }}>
                    {step.title}
                  </h3>
                  
                  <p className="text-black/60 font-inter text-xs md:text-sm leading-relaxed mb-4">
                    {step.desc}
                  </p>

                  {/* Direct Action Link Button */}
                  {step.actionLink && (
                    <div className="mt-2">
                      {step.isExternal ? (
                        <a 
                          href={step.actionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black bg-lemon-glow/20 hover:bg-lemon-glow px-4 py-2 rounded-lg transition-colors"
                        >
                          {step.actionLabel} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <Link 
                          href={step.actionLink}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black bg-lemon-glow/20 hover:bg-lemon-glow px-4 py-2 rounded-lg transition-colors"
                        >
                          {step.actionLabel} <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Optional Alert for Step 1 */}
                  {step.alert && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{step.alert}</span>
                    </div>
                  )}

                  {/* UI Hint / Button Placeholder */}
                  {index === 3 && (
                    <div className="mt-6 flex items-center justify-start p-4 bg-white rounded-xl border border-black/5 shadow-inner">
                      <button className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-lg pointer-events-none">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
                        <span className="text-xs font-bold font-inter text-slate-700">Continue with Google</span>
                      </button>
                    </div>
                  )}
                  {index === 2 && (
                    <div className="mt-6 flex items-center justify-start p-4 bg-white rounded-xl border border-black/5 shadow-inner">
                      <div className="w-10 h-10 bg-lemon-glow rounded-xl shadow-md shadow-lemon-glow/30 flex items-center justify-center text-black">
                        <PlusSquare size={20} />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="mt-16 text-center border-t border-black/5 pt-10">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Ready to Automate Your Business?
          </h2>
          <Link href="/login" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-[10px] font-black tracking-widest uppercase hover:bg-[#eab308] hover:text-black transition-all group">
            Go to Dashboard <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </main>

      {/* ── Footer ── */}
      <FooterSection />
    </div>
  );
}
