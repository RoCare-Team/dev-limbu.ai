"use client";

import {
  MessageCircle,
  LayoutDashboard,
  Sparkles,
  Type,
  Image as ImageIcon,
  Zap,
  Eye,
  Send,
  ArrowRight,
  MousePointer2,
  Palette,
  Mic,
  Coins,
  Share2,
  Calendar,
} from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import Link from "next/link";

export default function HowToCreatePost() {
  const creationSteps = [
    {
      icon: LayoutDashboard,
      title: "Step 1: Access the Post Studio",
      desc: "Inside your Limbu AI Dashboard, click on 'Post Management' in the left sidebar. This opens your creative workspace.",
    },
    {
      icon: Share2,
      title: "Step 2: Choose Your Platforms",
      desc: "At the top, you'll see toggles for ALL, Google (G), Facebook (F), and Instagram (I). Select where you want your post to appear.",
    },
    {
      icon: Type,
      title: "Step 3: The AI Prompt Box",
      desc: "Tell the AI what to create in the 'What would you like to create?' box. You can type it out or click the Microphone icon to use your voice!",
    },
    {
      icon: MousePointer2,
      title: "Step 4: Business & Keywords",
      desc: "Select your Business Name and add relevant Keywords. This ensures the AI uses the right context for your specific location.",
    },
    {
      icon: Palette,
      title: "Step 5: The Brand Studio",
      desc: "Upload your Logo, Product images, or even staff in 'Uniform'. Choose your preferred 'Size' (e.g., 3:4 for Instagram) and 'Color' theme to match your brand.",
    },
    {
      icon: Sparkles,
      title: "Step 6: Initialize AI Magic",
      desc: "Click 'INITIALIZE AUTO POST'. Limbu AI will now combine your prompt, assets, and branding into a stunning professional post.",
    },
  ];

  const previewActions = [
    {
      icon: Eye,
      title: "Live Preview Hub",
      desc: "On the right, you'll see exactly how your post looks. You can read the AI-generated caption and see the final design.",
    },
    {
      icon: Coins,
      title: "AI Video Upgrade",
      desc: "Want more engagement? Click 'Convert to Video (auto)'. For 200 coins, our AI turns your static image into a high-quality short video.",
    },
    {
      icon: Send,
      title: "Publish or Schedule",
      desc: "Final step! Click 'Post to GMB' to go live immediately, or click 'Schedule' to pick the perfect date and time for your audience.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden">
      <HeaderSection />

      {/* ── Background Aesthetics ── */}
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
          background:
            "radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* ── WhatsApp Helper ── */}
      <a
        href="https://wa.me/917065178662?text=Hi%20Limbu%20AI,%20I%20need%20help%20using%20the%20Post%20Studio."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 p-3 pr-5 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-all"
      >
        <MessageCircle size={24} />
        <span className="text-[12px] font-bold uppercase tracking-wider hidden sm:block">
          Talk to us
        </span>
      </a>

      <main className="flex-1 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-16 w-full">
        {/* ── Header ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-lemon-glow/10 border border-lemon-glow/20">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-lemon-hover">
              Studio Guide
            </span>
          </div>

          <h1
            className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            How to Create Post with{" "}
            <span className="text-lemon-hover">Limbu AI</span>
          </h1>

          <p className="text-sm font-medium text-black/60 max-w-xl mx-auto leading-relaxed font-inter">
            Master the Post Management dashboard. Learn how to use our AI tools
            to generate, preview, and publish stunning content for your
            business.
          </p>
        </div>

        {/* ── Main Creation Grid ── */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
          {/* Left Side: Creation Controls */}
          <div>
            <h2
              className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Zap className="text-lemon-hover" size={24} /> The Creation Panel
            </h2>
            <div className="space-y-6">
              {creationSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-black/5 rounded-3xl p-6 hover:bg-white hover:shadow-xl hover:shadow-lemon-glow/5 transition-all group"
                >
                  <div className="flex gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-lemon-hover group-hover:bg-lemon-glow group-hover:text-black transition-all shrink-0">
                      <step.icon size={20} />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-black uppercase tracking-wider mb-1"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-black/70 leading-relaxed font-inter">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Preview & Publish */}
          <div className="lg:sticky lg:top-32">
            <h2
              className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Eye className="text-lemon-hover" size={24} /> Preview & Publish
            </h2>
            <div className="space-y-6">
              {previewActions.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-black/5 rounded-3xl p-6 hover:bg-white hover:shadow-xl hover:shadow-lemon-glow/5 transition-all group"
                >
                  <div className="flex gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-lemon-hover group-hover:bg-lemon-glow group-hover:text-black transition-all shrink-0">
                      <step.icon size={20} />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-black uppercase tracking-wider mb-1"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-black/70 leading-relaxed font-inter">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Coins Visual Hint */}
              <div className="mt-8 p-6 bg-lemon-glow/5 border border-dashed border-lemon-glow/30 rounded-3xl text-center">
                <div className="flex items-center justify-center gap-2 text-lemon-hover mb-2">
                  <Coins size={20} />
                  <span className="text-lg font-black tracking-widest">
                    203 COINS
                  </span>
                </div>
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-tighter leading-tight">
                  Your balance is shown at the top right. <br /> Use coins for
                  premium AI video motion upgrades.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Tips / Legend ── */}
        <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-black/5">
          <h2
            className="text-center text-lg font-black uppercase tracking-widest mb-10"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Quick Tips for{" "}
            <span className="text-lemon-hover">Perfect Posts</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Mic size={20} className="text-lemon-hover" />
              </div>
              <h4 className="text-xs font-black uppercase mb-2">Voice Input</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">
                Too busy to type? Use the microphone icon to speak your post
                idea directly to Limbu AI.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Palette size={20} className="text-lemon-hover" />
              </div>
              <h4 className="text-xs font-black uppercase mb-2">
                Asset Studio
              </h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">
                Upload 'Brand Assets' like your logo or product photo to ensure
                every post stays true to your business identity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Calendar size={20} className="text-lemon-hover" />
              </div>
              <h4 className="text-xs font-black uppercase mb-2">Consistency</h4>
              <p className="text-[11px] text-black/50 font-inter leading-relaxed">
                Use the 'Schedule' feature to plan a whole week of posts in one
                sitting, keeping your business top-of-mind.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="mt-20 text-center">
          <Link
            href="/post-management"
            className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl text-xs font-black tracking-[0.2em] uppercase hover:bg-lemon-hover hover:text-black transition-all group"
          >
            Start Creating Now{" "}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
