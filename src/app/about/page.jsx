"use client";

import Image from "next/image";
import {
  MessageCircle,
  Store,
  TrendingUp,
  Users,
  Zap,
  Quote,
  Smartphone,
  Globe,
  BarChart,
} from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";


export default function AboutPage() {
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
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%)",
        }}
      />

      <main className="flex-1 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 lg:pt-40 pb-20">
        {/* ── Hero Section ── */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--lemon-hover)" }}
            />
            <span
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "var(--lemon-hover)" }}
            >
              The Limbu AI Mission
            </span>
          </div>

          {/* Smaller Heading */}
          <h1
            className="text-xl md:text-2xl font-black uppercase tracking-tight mb-6"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--cyber-black)",
            }}
          >
            Get More Customers & Grow Your{" "}
            <span style={{ color: "var(--lemon-hover)" }}>Local Business</span>{" "}
            Effortlessly
          </h1>

          {/* 2 Line Description */}
          <p className="text-sm md:text-base font-medium text-black/60 max-w-xl mx-auto leading-relaxed font-inter">
            We completely automate your Google My Business and social media
            presence. Attract new local customers, boost foot traffic, and watch
            your revenue grow on autopilot.
          </p>
        </div>

        {/* ── Businesses We Grow (Smaller Image Gallery) ── */}
        <div className="mb-24">
          <div className="flex items-center justify-center gap-4 mb-10 text-center">
            <h2
              className="text-xl md:text-2xl font-black uppercase tracking-tight"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--cyber-black)",
              }}
            >
              Who We <span className="text-[#eab308]">Empower</span>
            </h2>
          </div>

          {/* More Images, Smaller Grid (aspect-square) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              {
                title: "Restaurants",
                image:
                  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Salons & Spas",
                image:
                  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Clinics",
                image:
                  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Gyms",
                image:
                  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Retail Stores",
                image:
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Real Estate",
                image:
                  "https://images.unsplash.com/photo-1560518846-1ea118f396af?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Auto Repair",
                image:
                  "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Dentists",
                image:
                  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Contractors",
                image:
                  "https://images.unsplash.com/photo-1504307651254-35680f356f90?q=80&w=400&auto=format&fit=crop",
              },
              {
                title: "Pet Care",
                image:
                  "https://images.unsplash.com/photo-1516734212450-7163c4f74d08?q=80&w=400&auto=format&fit=crop",
              },
            ].map((biz, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl overflow-hidden bg-slate-100 aspect-square shadow-sm border border-black/5 hover:shadow-lg transition-all"
              >
                <Image
                  src={biz.image}
                  alt={biz.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3
                    className="text-white text-[11px] font-black uppercase tracking-wider text-center"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {biz.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── New Section: How It Works ── */}
        <div className="mb-24 px-6 py-12 rounded-[2rem] border border-lemon-glow/20 bg-lemon-glow/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lemon-glow/10 blur-[80px] rounded-full pointer-events-none" />
          <h2
            className="text-xl md:text-2xl font-black uppercase tracking-tight text-center mb-10"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--cyber-black)",
            }}
          >
            How Limbu AI <span className="text-[#eab308]">Works</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-center relative z-10">
            {[
              {
                icon: Globe,
                title: "1. Connect",
                desc: "Link your Google My Business and Social Media accounts in just two clicks.",
              },
              {
                icon: Zap,
                title: "2. Automate",
                desc: "Our AI generates localized content, replies to reviews, and posts automatically.",
              },
              {
                icon: BarChart,
                title: "3. Grow",
                desc: "Watch your local search rankings soar and customer footfall increase steadily.",
              },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border border-lemon-glow/30 mb-4 text-[#eab308]">
                  <step.icon size={24} />
                </div>
                <h3
                  className="text-sm font-black uppercase tracking-wider mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-black/60 font-inter max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Local Business Stats Section (Smaller Headings) ── */}
        <div className="bg-black text-white rounded-[2rem] p-8 md:p-12 mb-24 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-lemon-glow/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-2xl md:text-3xl text-white font-black uppercase tracking-tight mb-4 leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                The State of{" "}
                <span className="text-[#eab308]">Local Business</span>
              </h2>
              <p className="text-white/60 text-sm mb-8 font-inter leading-relaxed">
                In today's hyper-competitive market, your digital storefront is
                more important than your physical one. Customers search, judge,
                and decide before ever stepping foot inside.
              </p>
              <a
                href="https://wa.me/919999999999"
                className="inline-flex items-center gap-2 bg-[#eab308] text-black px-6 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase hover:scale-105 transition-transform"
              >
                <MessageCircle size={16} /> Talk to us
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, stat: "97%", text: "Consumers search locally" },
                {
                  icon: TrendingUp,
                  stat: "3x",
                  text: "More visibility with GMB",
                },
                {
                  icon: Store,
                  stat: "70%",
                  text: "Visit stores after searching",
                },
                {
                  icon: Smartphone,
                  stat: "24/7",
                  text: "AI engagement manager",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md"
                >
                  <item.icon className="text-[#eab308] mb-3" size={20} />
                  <h4
                    className="text-xl font-black text-white mb-1"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.stat}
                  </h4>
                  <p className="text-white/50 text-[10px] font-inter uppercase tracking-wider">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Why We Started & Founder Info ── */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="aspect-square max-w-sm mx-auto rounded-[2rem] overflow-hidden bg-slate-100 relative shadow-xl">
              {/* Founder Image Placeholder - Replace with actual founder image */}
              <Image
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=800&auto=format&fit=crop"
                alt="Limbu AI Founder"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="inline-flex p-2 bg-[#eab308] rounded-lg mb-3">
                  <Quote size={18} className="text-black" />
                </div>
                <h3
                  className="text-white text-lg font-black uppercase tracking-wider mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Amit Kumar
                </h3>
                <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase">
                  Founder, Limbu AI
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#eab308] mb-3">
              Our Origin Story
            </h2>
            <h3
              className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6 leading-tight"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--cyber-black)",
              }}
            >
              Why We Started Limbu AI
            </h3>

            <div className="space-y-4 text-black/70 font-inter text-sm leading-relaxed">
              <p>
                We spent years observing incredible local
                businesses—neighborhood cafes, expert salons, and trusted
                clinics—lose out to heavily-funded competitors simply because
                they didn't have the resources to master their digital presence.
              </p>
              <p className="font-bold text-black border-l-2 border-[#eab308] pl-4 py-1 my-4">
                "Our mission is to democratize digital marketing. We want to
                give every local business the power of an elite marketing
                agency, driven entirely by AI."
              </p>
              <p>
                That’s why Limbu AI was born. We built an intelligent engine
                that automates local SEO, GMB posting, and audience engagement.
                We turn your online profile into an effortless, 24/7 customer
                acquisition machine so you can focus on serving your customers.
              </p>
            </div>

            <div className="mt-8">
              <a
                href="https://wa.me/919999999999"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-[#eab308] hover:text-black transition-colors"
              >
                <MessageCircle size={16} /> Talk to us
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <FooterSection />
    </div>
  );
}
