"use client";

import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  MessageCircle,
  Calendar,
  Clock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Users
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";

function ThankYouContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "Guest";
  const date = searchParams.get("date") || new Date().toDateString();
  const phone = searchParams.get("phone") || "Registered Node";

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
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, var(--lemon-glow) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center">
        
        {/* Success Icon */}
        <div className="mb-6 relative group">
          <div className="absolute inset-0 bg-lemon-glow/20 blur-2xl rounded-full animate-pulse group-hover:bg-lemon-glow/40 transition-all" />
          <div className="relative bg-black p-5 rounded-[1.5rem] shadow-xl border border-black/10">
            <CheckCircle className="w-10 h-10 text-lemon-glow" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-lemon-hover animate-bounce" />
        </div>

        {/* Heading */}
        <div className="text-center mb-16">
          <h1 
            className="font-black text-3xl uppercase tracking-tight text-black mb-3" 
            style={{ fontFamily: "var(--font-heading)"}}
          >
            Thank You <span className="text-lemon-hover">For Registration</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Your slot is synchronized • One final step remaining</p>
        </div>

        {/* Main Grid - Community Focused */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* LEFT: Community CTA (PRIMARY FOCUS) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-black rounded-[3rem] p-10 sm:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex-1 border border-lemon-glow/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-lemon-glow/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-lemon-glow/20" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-lemon-glow/10 border border-lemon-glow/20">
                  <span className="w-2 h-2 rounded-full bg-lemon-hover animate-ping" />
                  <span className="text-[10px] font-black uppercase text-lemon-glow tracking-widest">Action Required</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-6 leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                  Join Our <br/> <span className="text-lemon-glow">VIP Community</span>
                </h2>

                <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed mb-10 max-w-md">
                  We'll transmit your <span className="text-white">Live Webinar Link</span>, exclusive <span className="text-lemon-glow">AI Prompts</span>, and automation tips inside our verified WhatsApp community.
                </p>

                <div className="space-y-4">
                  <a
                    href="https://chat.whatsapp.com/Dk8wZjTMxQL4CT8MrhxUgD"
                    target="_blank"
                    className="group w-full py-5 bg-lemon-glow text-black rounded-[1.5rem] font-black text-xs sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:scale-[1.02] transition-all shadow-2xl"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Enter WhatsApp Community ↗
                  </a>
                  <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-widest">Verified access for registered nodes only</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Deployment Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-black/5 rounded-[2.5rem] p-8 sm:p-10 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
               <div className="absolute top-0 left-0 w-full h-1 bg-slate-100" />
               
               <h2 className="text-[11px] font-black text-black uppercase tracking-widest mb-8 flex items-center gap-3">
                 <div className="p-1.5 bg-slate-50 rounded-lg border border-black/5 text-slate-400"><Users className="w-4 h-4" /></div>
                 Registry Status
               </h2>

               <div className="space-y-6">
                  <DetailRow icon={<User/>} label="Identity" value={name} />
                  <DetailRow icon={<Phone/>} label="Uplink" value={phone} />
                  <DetailRow icon={<Calendar/>} label="Sync" value={date} themed />
                  <DetailRow icon={<Clock/>} label="Window" value="04:00 PM IST" themed />
               </div>
            </div>

            <Link
              href="/"
              className="py-5 bg-white border border-black/5 rounded-[1.5rem] text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}

function DetailRow({ icon, label, value, themed }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${themed ? 'bg-lemon-glow/10 border-lemon-glow/20 text-lemon-hover' : 'bg-slate-50 border-black/5 text-black'}`}>
        {cloneElement(icon, { size: 18 })}
      </div>
      <div>
        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${themed ? 'text-lemon-hover/60' : 'text-slate-400'}`}>
          {label}
        </p>
        <p className="text-sm font-black text-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

import { cloneElement } from "react";

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ThankYouContent />
    </Suspense>
  );
}
