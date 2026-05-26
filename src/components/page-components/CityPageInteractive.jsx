"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Phone,
  Calculator,
  TrendingUp,
  ArrowRight,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";

const DEFAULT_DEMO_IMAGE = "/images/city-page/hero.png";
const DEMO_VIDEO_URL =
  "https://youtu.be/eQUd6u36w3g?si=_AJ3OymZQD6HnXRl";

function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function StickyBar({ waUrl }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ${visible ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-between gap-4 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <div>
          <p className="text-white font-bold text-sm leading-tight">
            🚀 Free Profile Audit
          </p>
          <p className="text-yellow-400 text-xs font-medium">
            Limited spots available today
          </p>
        </div>
        <a
          href={waUrl}
          className="flex-shrink-0 bg-green-500 hover:bg-green-400 text-white font-bold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 transition-colors shadow-lg"
        >
          <Phone className="w-4 h-4" /> WhatsApp Now
        </a>
      </div>
    </div>
  );
}

export function StatCard({ target, suffix, label }) {
  const { ref, inView } = useInView();
  const val = useCountUp(target, 1800, inView);
  return (
    <div ref={ref} className="px-4 text-center">
      <p className="text-3xl md:text-4xl font-extrabold text-yellow-400 mb-1">
        {val.toLocaleString()}
        {suffix}
      </p>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

export function ROICalculator() {
  const [customers, setCustomers] = useState(50);
  const [avg, setAvg] = useState(500);
  const currentMonthly = customers * avg;
  const newCustomers = Math.round(customers * 2.8);
  const newMonthly = newCustomers * avg;
  const gain = newMonthly - currentMonthly;
  const limbuCost = 4999;
  const roi = Math.round((gain / limbuCost) * 100);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl" />
      <h3 className="text-slate-900 font-bold text-xl mb-6 flex items-center gap-3 relative z-10">
        <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-400/20">
          <Calculator className="w-5 h-5 text-slate-900" />
        </div>
        Revenue Potential
      </h3>
      <div className="space-y-6 relative z-10">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-600 font-semibold text-sm">
              Monthly customers from Google
            </span>
            <span className="text-slate-900 font-bold text-sm bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              {customers}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={customers}
            onChange={(e) => setCustomers(+e.target.value)}
            className="w-full accent-yellow-400 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer border border-slate-200"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-600 font-semibold text-sm">
              Average order value (₹)
            </span>
            <span className="text-slate-900 font-bold text-sm bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              ₹{avg.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={avg}
            onChange={(e) => setAvg(+e.target.value)}
            className="w-full accent-yellow-400 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer border border-slate-200"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-slate-500 text-[10px] mb-1 font-bold uppercase tracking-wider">
            Current Monthly
          </p>
          <p className="text-slate-400 font-bold text-lg line-through decoration-red-400/50">
            ₹{currentMonthly.toLocaleString()}
          </p>
        </div>
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
          <p className="text-yellow-700 text-[10px] mb-1 font-bold uppercase tracking-wider">
            Potential Growth
          </p>
          <p className="text-yellow-600 font-bold text-lg">
            ₹{newMonthly.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 bg-slate-900 rounded-2xl p-6 text-center relative z-10 shadow-xl shadow-slate-900/20">
        <p className="text-slate-400 text-[10px] mb-1 font-bold uppercase tracking-widest">
          Est. Monthly Revenue Gain
        </p>
        <p className="text-white font-black text-3xl md:text-4xl mb-3 tracking-tight">
          +₹{gain.toLocaleString()}
        </p>
        <div className="inline-flex items-center gap-1.5 bg-green-500 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg shadow-green-500/30">
          <TrendingUp className="w-3 h-3" /> {roi}% ROI
        </div>
      </div>

      <Link
        href="/login"
        className="mt-6 w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-xl shadow-yellow-400/30 text-sm"
      >
        Get This ROI For My Business <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export function DemoSection({ dashboardImg }) {
  const setSelectedVideo = useAuthStore((state) => state.setSelectedVideo);

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-100 px-3 py-1 rounded-full">
            Platform Demo
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-6 mb-3">
            Watch How It Works
          </h2>
          <p className="text-slate-500 text-lg">
            Understand why Limbu AI is the best choice for local growth in 2
            minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedVideo(DEMO_VIDEO_URL)}
          className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl cursor-pointer group border-4 border-white"
        >
          <img
            src={dashboardImg || DEFAULT_DEMO_IMAGE}
            alt="Dashboard demo"
            className="w-full h-64 md:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/50 transition-colors flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-300 mb-6">
              <Play
                className="w-10 h-10 text-slate-900 ml-2"
                fill="currentColor"
              />
            </div>
            <p className="text-white font-bold text-xl drop-shadow-md">
              Watch Live Demo
            </p>
          </div>
        </button>
        <div className="mt-8 grid grid-cols-3 gap-4 text-center max-w-3xl mx-auto">
          {[
            ["2 Min", "Setup time"],
            ["24 Hrs", "Profile goes live"],
            ["30 Days", "Measurable ROI"],
          ].map(([v, l]) => (
            <div
              key={l}
              className="bg-white rounded-2xl py-5 border border-slate-100 shadow-sm"
            >
              <p className="text-xl md:text-2xl font-extrabold text-slate-900">
                {v}
              </p>
              <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
                {l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CityFaqAccordion({ faqs }) {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <div
          key={faq.question}
          className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === i ? "bg-slate-50 shadow-md border-yellow-400" : "bg-white border-slate-100 hover:border-slate-200"}`}
        >
          <button
            type="button"
            className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
            onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
          >
            <span className="font-bold text-slate-900 pr-4">{faq.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-yellow-500" : ""}`}
            />
          </button>
          <div
            className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <p className="text-slate-600 font-medium leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
