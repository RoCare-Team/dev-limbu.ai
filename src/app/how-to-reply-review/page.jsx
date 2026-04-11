"use client";

import { 
  MessageCircle, 
  Star, 
  Zap, 
  MessageSquare, 
  RefreshCw, 
  ShieldCheck, 
  BrainCircuit, 
  ArrowRight,
  MousePointer2
} from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import Link from "next/link";

export default function HowToReplyReview() {
  const steps = [
    {
      icon: MessageSquare,
      title: "Step 1: Open Reputation Manager",
      desc: "On your Limbu AI sidebar, click 'Review Management'. This opens your 'Reputation Manager' feed, where all your customer feedback is gathered in one place.",
      actionLabel: "Go to Review Management",
      actionLink: "/review-management",
    },
    {
      icon: ShieldCheck,
      title: "Step 2: Monitor Your Live Feed",
      desc: "The 'Live Feed' indicator shows you exactly how many new entries are detected. Limbu AI continuously scans your Google profile to catch every new review as it arrives.",
    },
    {
      icon: BrainCircuit,
      title: "Step 3: Choose Your Mode (Manual vs AI Auto)",
      desc: "At the top right, you can toggle between 'MANUAL' and 'AI AUTO'. In 'AI AUTO' mode, Limbu AI will intelligently draft perfect, polite, and brand-consistent replies for you instantly.",
    },
    {
      icon: Zap,
      title: "Step 4: AI Response Deployment",
      desc: "Look for the 'AI RESPONSE DEPLOYED' section under a review. Our AI reads the customer's sentiment (like a 5-star 'good service' rating) and writes a personalized thank-you note that mentions the customer by name.",
    },
    {
      icon: RefreshCw,
      title: "Step 5: Stay Fresh with One Click",
      desc: "Received new reviews while you were away? Simply click the 'REFRESH' button to sync the latest customer feedback into your dashboard immediately.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden">
      <HeaderSection />

      {/* ── Background Aesthetics ── */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] z-0 opacity-10" style={{ background: "radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%)" }} />

      {/* ── WhatsApp Helper ── */}
      <a href="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20need%20help%20replying%20to%20my%20customer%20reviews." target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 z-50 flex items-center gap-2 p-3 pr-5 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-all">
        <MessageCircle size={24} />
        <span className="text-[12px] font-bold uppercase tracking-wider hidden sm:block">Talk to us</span>
      </a>

      <main className="flex-1 relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-16 w-full">
        
        {/* ── Header ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-lemon-glow/10 border border-lemon-glow/20">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-lemon-hover">Reputation Hub</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            How to Reply to Reviews with <span className="text-lemon-hover">Limbu AI</span>
          </h1>

          <p className="text-sm md:text-base font-medium text-black/60 max-w-xl mx-auto leading-relaxed font-inter">
            Build trust and boost your local rankings by responding to every customer instantly using our AI-powered Reputation Manager.
          </p>
        </div>

        {/* ── Steps Timeline ── */}
        <div className="relative mb-20">
          <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-lemon-glow/20 hidden md:block" />

          <div className="space-y-6 md:space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col md:flex-row gap-5 md:gap-8 group">
                
                {/* Icon Container */}
                <div className="hidden md:flex flex-col items-center z-10">
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-lemon-glow shadow-md flex items-center justify-center text-lemon-hover group-hover:bg-lemon-hover group-hover:text-black transition-all">
                    <step.icon size={20} />
                  </div>
                  <div className="mt-3 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-black/40">
                    0{index + 1}
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-slate-50 border border-black/5 rounded-[2rem] p-6 md:p-8 hover:bg-white hover:shadow-xl hover:shadow-lemon-glow/5 transition-all">
                  <div className="flex items-center gap-3 mb-3 md:hidden">
                    <div className="w-10 h-10 rounded-lg bg-lemon-glow text-black flex items-center justify-center">
                      <step.icon size={18} />
                    </div>
                    <span className="text-[10px] font-black text-black/40 uppercase">Step 0{index + 1}</span>
                  </div>

                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)" }}>{step.title}</h3>
                  <p className="text-sm text-black/70 leading-relaxed font-inter">{step.desc}</p>

                  {step.actionLink && (
                    <div className="mt-4">
                      <Link href={step.actionLink} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black bg-lemon-glow/20 hover:bg-lemon-glow px-4 py-2 rounded-lg transition-colors">
                        {step.actionLabel} <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}

                  {/* Contextual Visual Clue (AI Response Box) */}
                  {index === 3 && (
                    <div className="mt-6 p-4 bg-white rounded-2xl border border-lemon-glow/20 shadow-inner">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={12} className="text-[#eab308]" />
                        <span className="text-[9px] font-black text-[#eab308] uppercase tracking-widest">AI Response Deployed</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full mb-2" />
                      <div className="h-3 w-[80%] bg-slate-100 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dashboard Legend (Explain all UI boxes) ── */}
        <div className="bg-slate-50 border border-black/5 rounded-[2.5rem] p-8 md:p-12 mb-20">
          <h2 className="text-center text-lg font-black uppercase tracking-widest mb-10" style={{ fontFamily: "var(--font-heading)" }}>
            Dashboard <span className="text-lemon-hover">Legend</span>
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-lemon-hover"><RefreshCw size={18} /></div>
              <div>
                <h4 className="text-xs font-black uppercase mb-1">Refresh Button</h4>
                <p className="text-[11px] text-black/50 leading-relaxed font-inter">Instantly syncs the newest reviews from your Google My Business profile.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-lemon-hover"><MousePointer2 size={18} /></div>
              <div>
                <h4 className="text-xs font-black uppercase mb-1">Manual/AI Toggle</h4>
                <p className="text-[11px] text-black/50 leading-relaxed font-inter">Switch between writing your own replies or letting Limbu AI automate them for you.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-lemon-hover"><Star size={18} /></div>
              <div>
                <h4 className="text-xs font-black uppercase mb-1">Verified Feed</h4>
                <p className="text-[11px] text-black/50 leading-relaxed font-inter">Confirms that the review is directly from your official Google Business profile.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-lemon-hover"><MessageCircle size={18} /></div>
              <div>
                <h4 className="text-xs font-black uppercase mb-1">Live Entries</h4>
                <p className="text-[11px] text-black/50 leading-relaxed font-inter">Shows the total count of reviews currently being managed by your feed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="text-center border-t border-black/5 pt-10">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Ready to Protect Your Reputation?
          </h2>
          <Link href="/review-management" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-lemon-hover hover:text-black transition-all group">
            Go to Reputation Manager <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </main>

      <FooterSection />
    </div>
  );
}
