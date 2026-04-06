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
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";

function ThankYouContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "Guest";
  const date = searchParams.get("date") || new Date().toDateString();
  const phone = searchParams.get("phone") || "Registered Number";

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-start sm:items-center justify-center bg-[#050505] text-white font-sans py-16 sm:py-20">
        {/* Background Glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#FDE047]/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#FDE047]/5 blur-[120px] rounded-full" />
        </div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          {/* Icon */}
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-[#FDE047] blur-2xl opacity-20 animate-pulse"></div>
            <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-[#FDE047] relative z-10" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 tracking-tight text-center">
            Thank <span className="text-[#FDE047]">You!</span>
          </h1>

          <p className="text-sm sm:text-base text-white/50 mb-8 uppercase tracking-widest text-center">
            You are all set for the AI Masterclass
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* LEFT: Details */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl">
              <h2 className="text-[#FDE047] text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Your Booking Details
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/30 uppercase font-semibold tracking-wide">
                      Attendee
                    </p>
                    <p className="text-base sm:text-lg font-semibold">{name}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/30 uppercase font-semibold tracking-wide">
                      Contact
                    </p>
                    <p className="text-base sm:text-lg font-semibold">
                      {phone}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FDE047]/10 rounded-xl flex items-center justify-center border border-[#FDE047]/20">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#FDE047]" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-[#FDE047]/50 uppercase font-semibold tracking-wide">
                      Date
                    </p>
                    <p className="text-base sm:text-lg font-semibold">{date}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FDE047]/10 rounded-xl flex items-center justify-center border border-[#FDE047]/20">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FDE047]" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-[#FDE047]/50 uppercase font-semibold tracking-wide">
                      Time
                    </p>
                    <p className="text-base sm:text-lg font-semibold">
                      04:00 PM (IST)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: CTA */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-5 sm:p-6 md:p-8 flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-3">
                  Final Step: Join the Community
                </h2>

                <p className="text-sm sm:text-base text-white/50 mb-6 leading-relaxed">
                  Thank you for choosing{" "}
                  <span className="text-white font-semibold">Limbu AI</span> 🙌{" "}
                  <br />
                  We’ll share your{" "}
                  <span className="text-white font-semibold">
                    Google Meet link
                  </span>{" "}
                  along with exclusive{" "}
                  <span className="text-white font-semibold">
                    AI prompts & tips
                  </span>{" "}
                  inside our WhatsApp community. <br />
                  <br />
                  Make sure to join so you don’t miss any updates 🚀
                </p>

                <a
                  href="https://chat.whatsapp.com/Dk8wZjTMxQL4CT8MrhxUgD"
                  target="_blank"
                  className="group w-full py-3 sm:py-4 text-sm sm:text-base bg-[#25D366] text-white rounded-2xl font-bold uppercase tracking-wide flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Join Community
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </a>
              </div>

              <Link
                href="/"
                className="py-4 sm:py-5 bg-white/5 border border-white/10 rounded-2xl text-center font-semibold hover:bg-white/10 transition uppercase tracking-wide text-xs sm:text-sm"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <ThankYouContent />
    </Suspense>
  );
}
