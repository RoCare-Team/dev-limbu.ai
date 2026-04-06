"use client";

import { MessageSquare, Calendar, TrendingUp, Shield, ArrowRight, Zap } from "lucide-react";

export default function ComparisonSection() {
  const features = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Review Replies",
      old: "Manual, delayed responses",
      new: "Instant AI-driven SEO optimization",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Content Planning",
      old: "Fragmented apps & spreadsheets",
      new: "Unified multi-platform dashboard",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Scalability",
      old: "Chaos at single location",
      new: "Manage 100+ locations easily",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Security",
      old: "Password sharing risks",
      new: "Official API, 100% Encrypted",
    },
  ];

  return (
    <section id="comparison" className="py-24 relative" style={{ backgroundColor: "var(--cyber-black)" }}>
      {/* Subtle background texture/glow */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#FDE047 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border border-yellow-500/30 rounded-full">
            <Zap className="w-4 h-4 text-[#FDE047] fill-[#FDE047]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">Evolution</span>
          </div>
          <h2 className="font-normal uppercase leading-tight text-white mb-6" style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(2rem, 5vw, 4rem)" }}>
            Stop Doing <span style={{ color: "#FDE047" }}>Business The Old Way</span>
          </h2>
        </div>

        {/* Comparison Table Layout */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          
          {/* Table Head */}
          <div className="grid grid-cols-12 bg-white/5 p-6 border-b border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">
            <div className="col-span-4 pl-4">Feature</div>
            <div className="col-span-4 text-center">Legacy Methods</div>
            <div className="col-span-4 text-center text-[#FDE047]">The Limbu.ai Advantage</div>
          </div>

          {/* Table Body */}
          {features.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 p-6 items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
              {/* Feature Name */}
              <div className="col-span-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5 text-[#FDE047]">{item.icon}</div>
                <span className="text-white font-bold tracking-tight">{item.title}</span>
              </div>

              {/* Old Way */}
              <div className="col-span-4 text-center text-white/40 text-sm italic font-light">
                {item.old}
              </div>

              {/* Limbu Way */}
              <div className="col-span-4 text-center text-white font-semibold flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4 text-[#FDE047]" />
                {item.new}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <button className="px-8 cursor-pointer py-4 bg-[#FDE047] text-black font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(253,224,71,0.3)]">
            Start Your Transformation
          </button>
        </div>
      </div>
    </section>
  );
}