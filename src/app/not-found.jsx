"use client";

import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white flex items-center justify-center px-6 py-16">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-400/10 blur-3xl rounded-full pointer-events-none" />

      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-yellow-300/10 blur-3xl rounded-full pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-yellow-400/10 border border-yellow-400/20 shadow-lg">
          <SearchX className="w-12 h-12 text-yellow-500" />
        </div>

        {/* 404 */}
        <h1
          className="text-[3.5rem] sm:text-[5rem] md:text-[7rem] font-black leading-none tracking-tight mb-3"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-slate-900">4</span>

          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            0
          </span>

          <span className="text-slate-900">4</span>
        </h1>

        {/* Heading */}
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
          Oops! Page Not Found
        </h2>

        {/* Description */}
        <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-8 font-medium">
          The page you're looking for doesn't exist, was moved,
          or the URL might be incorrect.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-sm font-black uppercase tracking-wider shadow-lg transition-all duration-300 hover:scale-[1.03]"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white hover:border-yellow-400 text-slate-700 hover:text-yellow-500 text-sm font-black uppercase tracking-wider shadow-sm transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Bottom Text */}
        <div className="mt-10 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">
          Limbu.ai • AI Powered Business Growth
        </div>
      </div>
    </section>
  );
}