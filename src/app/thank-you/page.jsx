"use client";

import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  MessageCircle,
  Calendar,
  Clock,
  User,
  Phone,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";

function ThankYouContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "Guest";
  const date = searchParams.get("date") || new Date().toDateString();
  const phone = searchParams.get("phone") || "Not Provided";
  const time = searchParams.get("time") || "4:00 PM IST";

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-5 py-16">

        {/* SUCCESS SECTION */}
        <div className="flex flex-col items-center text-center mb-12">
          
          <div className="p-5 bg-green-500/10 rounded-full mb-4 border border-green-500/20">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            You're Registered 🎉
          </h1>

          <p className="text-white/60 text-sm">
            Your webinar slot is confirmed. Join WhatsApp to get the link instantly.
          </p>

          {/* 🔥 Urgency badge */}
          {/* <div className="mt-3 text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full animate-pulse border border-green-500/30">
            ⚡ Instant Access via WhatsApp
          </div> */}
        </div>

        {/* GRID */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT: DETAILS */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6 shadow-lg">

            <h2 className="font-semibold text-lg">Booking Details</h2>

            <DetailRow icon={<User />} label="Name" value={name} />
            <DetailRow icon={<Phone />} label="Phone" value={phone} />
            <DetailRow icon={<Calendar />} label="Date" value={date} />
            <DetailRow icon={<Clock />} label="Time" value={time} />
          </div>

          {/* RIGHT: WHATSAPP CTA */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col justify-center text-center shadow-lg">

            <h2 className="text-xl font-semibold mb-4">
              Join WhatsApp Group 🚀
            </h2>

            <p className="text-white/60 text-sm mb-6">
              Get webinar link, reminders & bonus AI content inside the group.
            </p>

            {/* 🔥 WHATSAPP BUTTON */}
            <a
              href="https://chat.whatsapp.com/Dk8wZjTMxQL4CT8MrhxUgD"
              target="_blank"
              className="relative py-3 rounded-lg font-semibold overflow-hidden group"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-green-400 to-green-600 group-hover:scale-105 transition"></div>

              {/* Glow */}
              <div className="absolute inset-0 blur-xl opacity-40 bg-green-500 group-hover:opacity-70 transition"></div>

              {/* Text */}
              <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                <MessageCircle size={18} />
                Join WhatsApp Now
              </span>
            </a>

            {/* Trust line */}
            <p className="text-xs text-white/40 mt-3">
              ✔ Get link instantly • No spam • Limited members only
            </p>
          </div>
        </div>

        {/* BACK BUTTON */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2 bg-white/5 rounded-lg text-green-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ThankYouContent />
    </Suspense>
  );
}