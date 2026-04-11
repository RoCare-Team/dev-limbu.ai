"use client";

import { 
  MessageCircle, 
  QrCode, 
  ShieldCheck, 
  Settings2, 
  Download, 
  Printer, 
  Share2, 
  MousePointer2,
  ArrowRight,
  Zap,
  Star,
  Link as LinkIcon
} from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import Link from "next/link";

export default function HowToGenerateMagicQR() {
  const steps = [
    {
      icon: QrCode,
      title: "Step 1: Access Magic QR Studio",
      desc: "Find the 'Magic QR' tab in your Limbu AI sidebar. This is where you generate your smart reputation-filtering assets.",
      actionLabel: "Go to Magic QR",
      actionLink: "/get-magic-qr",
    },
    {
      icon: Settings2,
      title: "Step 2: Select Your Business",
      desc: "Use the 'Switch Active Business' dropdown at the top to select the specific location for which you want to generate the QR code.",
    },
    {
      icon: ShieldCheck,
      title: "Step 3: The Reputation Shield",
      desc: "Limbu AI automatically applies a 'Reputation Shield'. This smart logic ensures only happy customers are sent to Google, while private feedback is captured for lower ratings.",
    },
    {
      icon: Zap,
      title: "Step 4: Preview Your Asset",
      desc: "Look at the 'Asset Preview' to see your professionally designed QR poster. It includes your business name, Google branding, and a call-to-rate.",
    },
    {
      icon: Download,
      title: "Step 5: Download or Print",
      desc: "Click 'PNG' to save a high-quality image for social media, or click 'PRINT' to get a physical poster for your shop's counter or tables.",
    },
    {
      icon: Share2,
      title: "Step 6: Share the Magic Link",
      desc: "Copy your unique 'Magic Link' or click 'SHARE PORTAL' to send your review link directly to customers via WhatsApp or Email.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden">
      <HeaderSection />

      {/* ── Background Aesthetics ── */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] z-0 opacity-10" style={{ background: "radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%)" }} />

      {/* ── WhatsApp Helper ── */}
      <a href="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20need%20help%20setting%20up%20my%20Magic%20QR." target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 z-50 flex items-center gap-2 p-3 pr-5 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-all">
        <MessageCircle size={24} />
        <span className="text-[12px] font-bold uppercase tracking-wider hidden sm:block">Talk to us</span>
      </a>

      <main className="flex-1 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-16 w-full">
        
        {/* ── Header ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-lemon-glow/10 border border-lemon-glow/20">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-lemon-hover">Growth Tools</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            How to Generate <span className="text-lemon-hover">Magic QR</span>
          </h1>

          <p className="text-sm md:text-base font-medium text-black/60 max-w-2xl mx-auto leading-relaxed font-inter">
            Create a smart gateway for your customers. Learn how to generate, download, and use Limbu AI's Magic QR to boost your 5-star ratings instantly.
          </p>
        </div>

        {/* ── Main Dashboard Grid Preview ── */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20 items-start">
          
          {/* Steps Column */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
              <Zap className="text-lemon-hover" size={24} /> The Setup Process
            </h2>
            {steps.map((step, idx) => (
              <div key={idx} className="bg-slate-50 border border-black/5 rounded-3xl p-6 hover:bg-white hover:shadow-xl hover:shadow-lemon-glow/5 transition-all group">
                <div className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-lemon-hover group-hover:bg-lemon-hover group-hover:text-black transition-all shrink-0">
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

          {/* Logic Visual Hub (Right Column) */}
          <div className="lg:sticky lg:top-32 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
              <ShieldCheck className="text-lemon-hover" size={24} /> The Shield Logic
            </h2>
            
            {/* Logic Box 1 */}
            <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Privacy Mode</span>
              </div>
              <p className="text-sm font-bold text-black/80 mb-2 uppercase tracking-tight">Negative Feedback is Filtered</p>
              <p className="text-xs text-black/50 font-inter leading-relaxed">Ratings of 1-3 stars are captured privately. This allows you to resolve issues internally without damaging your public Google rating.</p>
            </div>

            {/* Logic Box 2 */}
            <div className="bg-white border border-lemon-glow/30 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-lemon-glow/5 rounded-full -mr-10 -mt-10" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                  <Star className="text-lemon-hover fill-lemon-hover" size={16} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-lemon-hover">Growth Mode</span>
              </div>
              <p className="text-sm font-bold text-black/80 mb-2 uppercase tracking-tight">Happy Customers are Promoted</p>
              <p className="text-xs text-black/50 font-inter leading-relaxed">Ratings of 4-5 stars are instantly routed to your official Google My Business profile to go live publicly.</p>
            </div>

            {/* Visual Action Hint */}
            <div className="bg-black text-white rounded-3xl p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Printer className="text-lemon-hover" size={28} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase mb-1">Reputation Protocol</h4>
                <p className="text-[11px] text-white/50 font-inter">Deploy this QR at your point-of-sale, on tables, or delivery boxes to drive high-intent feedback.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ/Tips Section ── */}
        <div className="bg-slate-50 border border-black/5 rounded-[2.5rem] p-8 md:p-12">
          <h2 className="text-center text-lg font-black uppercase tracking-widest mb-10" style={{ fontFamily: "var(--font-heading)" }}>
            Magic QR <span className="text-lemon-hover">Quick Tips</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><LinkIcon size={20} className="text-lemon-hover" /></div>
              <h4 className="text-xs font-black uppercase mb-2">Magic Link</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">Every QR comes with a short link. Perfect for your Instagram Bio or WhatsApp status.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Printer size={20} className="text-lemon-hover" /></div>
              <h4 className="text-xs font-black uppercase mb-2">High-Res Print</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">Use the 'PRINT' button for a vector-ready layout that looks sharp on any physical material.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Share2 size={20} className="text-lemon-hover" /></div>
              <h4 className="text-xs font-black uppercase mb-2">Instant Sharing</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">Use the 'SHARE PORTAL' button to quickly send the rating page link to a customer's phone.</p>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="mt-20 text-center">
          <Link href="/get-magic-qr" className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl text-xs font-black tracking-[0.2em] uppercase hover:bg-lemon-hover hover:text-black transition-all group">
            Generate My Magic QR <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
