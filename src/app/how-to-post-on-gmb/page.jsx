"use client";

import { 
  MessageCircle, 
  MapPin, 
  Zap, 
  Send, 
  Calendar, 
  Eye, 
  MousePointer2,
  ArrowRight,
  TrendingUp,
  Search,
  CheckCircle2
} from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import Link from "next/link";

export default function HowToPostOnGMB() {
  const steps = [
    {
      icon: MapPin,
      title: "Step 1: Select the Google Platform",
      desc: "In the 'Post Management' dashboard, look at the platform selector at the top. Click on the 'G' icon (Google My Business) to ensure your post is optimized specifically for local search.",
      actionLabel: "Open Post Management",
      actionLink: "/post-management",
    },
    {
      icon: Zap,
      title: "Step 2: Generate Content",
      desc: "Use the 'Auto Post' tab to let AI write your GMB update. Type your business offer or news in the prompt box. GMB posts work best when they are clear and actionable.",
    },
    {
      icon: Eye,
      title: "Step 3: Verify the Live Preview",
      desc: "Check the 'Live Preview' on the right side. This shows exactly how your business update will appear to customers searching on Google Maps and Google Search.",
    },
    {
      icon: Send,
      title: "Step 4: Instant 'Post to GMB'",
      desc: "Ready to go live? Click the yellow 'Post to GMB' button. Limbu AI will instantly transmit your post to your verified Google Business Profile.",
    },
    {
      icon: Calendar,
      title: "Step 5: Schedule for Local Peak Hours",
      desc: "Want to post later? Click 'Schedule' to pick a time when your local customers are most active. Regular posting on GMB is a proven way to rank higher in local results.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden">
      <HeaderSection />

      {/* ── Background Aesthetics ── */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] z-0 opacity-10" style={{ background: "radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%)" }} />

      {/* ── WhatsApp Helper ── */}
      <a href="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20learn%20how%20to%20improve%20my%20GMB%20ranking." target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 z-50 flex items-center gap-2 p-3 pr-5 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-all">
        <MessageCircle size={24} />
        <span className="text-[12px] font-bold uppercase tracking-wider hidden sm:block">Talk to us</span>
      </a>

      <main className="flex-1 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-16 w-full">
        
        {/* ── Header ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-lemon-glow/10 border border-lemon-glow/20">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-lemon-hover">Local SEO Strategy</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            How to Post on <span className="text-lemon-hover">Google My Business</span>
          </h1>

          <p className="text-sm md:text-base font-medium text-black/60 max-w-2xl mx-auto leading-relaxed font-inter">
            Improve your local visibility and attract more customers from Google Maps. Learn how to publish regular business updates effortlessly using Limbu AI.
          </p>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
          
          {/* Steps Timeline */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
              <Zap className="text-lemon-hover" size={24} /> The GMB Workflow
            </h2>
            {steps.map((step, idx) => (
              <div key={idx} className="bg-slate-50 border border-black/5 rounded-3xl p-6 hover:bg-white hover:shadow-xl hover:shadow-lemon-glow/5 transition-all group">
                <div className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-lemon-hover group-hover:bg-lemon-glow group-hover:text-black transition-all shrink-0">
                    <step.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-heading)" }}>{step.title}</h3>
                    <p className="text-sm text-black/70 leading-relaxed font-inter">{step.desc}</p>
                    {step.actionLink && (
                      <Link href={step.actionLink} className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-bold uppercase tracking-widest text-black bg-lemon-glow/20 hover:bg-lemon-glow px-4 py-2 rounded-lg transition-colors">
                        {step.actionLabel} <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Strategic Benefits (Right Column) */}
          <div className="lg:sticky lg:top-32 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
              <TrendingUp className="text-lemon-hover" size={24} /> Why Post on GMB?
            </h2>
            
            <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Search size={24} /></div>
                <h4 className="text-sm font-black uppercase tracking-tight">Boost Local Rankings</h4>
              </div>
              <p className="text-xs text-black/60 font-inter leading-relaxed">Google rewards active businesses. Regular posting signals to Google that your business is open and relevant, helping you appear higher in the 'Local 3-Pack'.</p>
            </div>

            <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-50 rounded-2xl text-green-600"><CheckCircle2 size={24} /></div>
                <h4 className="text-sm font-black uppercase tracking-tight">Convert Searchers to Customers</h4>
              </div>
              <p className="text-xs text-black/60 font-inter leading-relaxed">Posts allow you to showcase offers, events, and products directly on the search results page, giving customers a reason to choose you over competitors.</p>
            </div>

            {/* Visual Action Hint from Image */}
            <div className="bg-slate-50 border border-dashed border-black/10 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-black uppercase text-black/40 tracking-widest">Button Action</span>
                 <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase">Approved</div>
              </div>
              <div className="w-full h-12 bg-lemon-glow rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-lemon-glow/20">
                <Send size={18} className="text-black" />
                <span className="text-xs font-black uppercase tracking-widest text-black">Post to GMB</span>
              </div>
              <p className="mt-4 text-[10px] text-center text-black/40 font-bold uppercase">This button in your dashboard makes you live instantly.</p>
            </div>
          </div>
        </div>

        {/* ── GMB Post Categories ── */}
        <div className="bg-slate-50 border border-black/5 rounded-[2.5rem] p-8 md:p-12">
          <h2 className="text-center text-lg font-black uppercase tracking-widest mb-10" style={{ fontFamily: "var(--font-heading)" }}>
            What to Post on <span className="text-lemon-hover">GMB?</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Zap size={20} className="text-lemon-hover" /></div>
              <h4 className="text-xs font-black uppercase mb-2">Offers & Deals</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">Announce a 20% discount or a 'Buy 1 Get 1' weekend special to drive immediate foot traffic.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><CheckCircle2 size={20} className="text-lemon-hover" /></div>
              <h4 className="text-xs font-black uppercase mb-2">New Arrivals</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">Showcase your latest products or services to keep your profile fresh and exciting.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Eye size={20} className="text-lemon-hover" /></div>
              <h4 className="text-xs font-black uppercase mb-2">Business News</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">Update your customers about holiday hours, new staff members, or renovations.</p>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="mt-20 text-center">
          <Link href="/post-management" className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl text-xs font-black tracking-[0.2em] uppercase hover:bg-lemon-hover hover:text-black transition-all group">
            Go to Post Studio <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
