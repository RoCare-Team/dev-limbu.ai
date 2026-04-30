"use client";

import React, { useState, useEffect, useRef, use } from "react";
import axios from "axios";
import {
  MapPin, TrendingUp, Star, Zap, MessageCircle, CheckCircle2,
  ChevronDown, ArrowRight, Quote, Map, Users, Smartphone,
  ShieldCheck, X, Phone, Clock, BadgeCheck, BarChart3,
  ThumbsUp, AlertCircle, Search, Award, Building2, Flame,
  ChevronRight, Play, Calculator, Target, IndianRupee,
  TrendingDown, Minus
} from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

/* ─── IMAGES ─────────────────────────────────────────────────── */
const DEFAULT_IMAGES = {
  hero: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200",
  dashboard: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
  localMap: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800",
  restaurant: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400",
  clinic: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400",
  retail: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=400",
};

/* ─── WHATSAPP CTA URL ────────────────────────────────────────── */
const WA = "https://wa.me/919289344726";

/* ─── COUNTER HOOK ────────────────────────────────────────────── */
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

/* ─── INTERSECTION OBSERVER HOOK ─────────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── STICKY WHATSAPP BAR ─────────────────────────────────────── */
function StickyBar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ${visible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-between gap-4 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <div>
          <p className="text-white font-bold text-sm leading-tight">🚀 Free Profile Audit</p>
          <p className="text-yellow-400 text-xs font-medium">Limited spots available today</p>
        </div>
        <a href={WA} className="flex-shrink-0 bg-green-500 hover:bg-green-400 text-white font-bold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 transition-colors shadow-lg">
          <Phone className="w-4 h-4" /> WhatsApp Now
        </a>
      </div>
    </div>
  );
}

/* ─── URGENCY BANNER ──────────────────────────────────────────── */
function UrgencyBanner({ cityName }) {
  const [spots] = useState(7);
  return (
    <div className="bg-slate-900 text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 flex-wrap border-b border-slate-800">
      <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
        <Flame className="w-4 h-4 animate-pulse" />
        <span>Only {spots} spots left this month!</span>
      </div>
      <span className="hidden sm:inline text-slate-400">|</span>
      <span className="text-slate-300">Special offer for {cityName} businesses.</span>
      <a href={WA} className="text-yellow-400 font-bold hover:text-yellow-300 underline underline-offset-2 ml-1">Claim Now →</a>
    </div>
  );
}

/* ─── STATS COUNTER ───────────────────────────────────────────── */
function StatCard({ target, suffix, label }) {
  const { ref, inView } = useInView();
  const val = useCountUp(target, 1800, inView);
  return (
    <div ref={ref} className="px-4 text-center">
      <p className="text-3xl md:text-4xl font-extrabold text-yellow-400 mb-1">{val.toLocaleString()}{suffix}</p>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

/* ─── ROI CALCULATOR ──────────────────────────────────────────── */
function ROICalculator() {
  const [customers, setCustomers] = useState(50);
  const [avg, setAvg] = useState(500);
  const currentMonthly = customers * avg;
  const newCustomers = Math.round(customers * 2.8);
  const newMonthly = newCustomers * avg;
  const gain = newMonthly - currentMonthly;
  const limbuCost = 4999;
  const roi = Math.round((gain / limbuCost) * 100);
  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl" />
      <h3 className="text-white font-extrabold text-xl mb-6 flex items-center gap-2 relative z-10">
        <Calculator className="w-5 h-5 text-yellow-400" /> ROI Calculator
      </h3>
      <div className="space-y-6 relative z-10">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Monthly customers from Google</span>
            <span className="text-white font-bold bg-slate-800 px-3 py-1 rounded-lg">{customers}</span>
          </div>
          <input type="range" min="10" max="500" step="10" value={customers}
            onChange={e => setCustomers(+e.target.value)}
            className="w-full accent-yellow-400 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Average order value (₹)</span>
            <span className="text-white font-bold bg-slate-800 px-3 py-1 rounded-lg">₹{avg.toLocaleString()}</span>
          </div>
          <input type="range" min="100" max="5000" step="100" value={avg}
            onChange={e => setAvg(+e.target.value)}
            className="w-full accent-yellow-400 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <p className="text-slate-400 text-xs mb-1 font-medium">Current Revenue</p>
          <p className="text-white font-bold text-lg">₹{currentMonthly.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-4">
          <p className="text-yellow-400 text-xs mb-1 font-medium">With Limbu AI</p>
          <p className="text-yellow-400 font-bold text-lg">₹{newMonthly.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-center relative z-10">
        <p className="text-slate-400 text-xs mb-1 font-medium">Estimated Monthly Gain</p>
        <p className="text-white font-extrabold text-3xl md:text-4xl">+₹{gain.toLocaleString()}</p>
        <div className="inline-block mt-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full">
          {roi}% ROI
        </div>
      </div>
      <a href={WA} className="mt-6 w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3.5 rounded-xl transition-all text-sm shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] relative z-10">
        Get This ROI For My Business <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}

/* ─── COMPARISON TABLE ────────────────────────────────────────── */
function ComparisonTable() {
  const rows = [
    { feature: "Google Posts (daily)", manual: <div className="flex items-center gap-2 justify-center text-slate-500"><X className="w-4 h-4 text-red-400" /> Takes 30 min/day</div>, agency: <div className="flex items-center gap-2 justify-center text-slate-500"><AlertCircle className="w-4 h-4 text-yellow-500" /> Weekly only</div>, limbu: <div className="flex items-center gap-2 justify-center text-slate-900 font-bold"><CheckCircle2 className="w-4 h-4 text-green-500" /> AI daily auto</div> },
    { feature: "Review replies", manual: <div className="flex items-center gap-2 justify-center text-slate-500"><X className="w-4 h-4 text-red-400" /> Often ignored</div>, agency: <div className="flex items-center gap-2 justify-center text-slate-500"><AlertCircle className="w-4 h-4 text-yellow-500" /> Slow (1–2 days)</div>, limbu: <div className="flex items-center gap-2 justify-center text-slate-900 font-bold"><CheckCircle2 className="w-4 h-4 text-green-500" /> Instant AI</div> },
    { feature: "5-star review collection", manual: <div className="flex items-center gap-2 justify-center text-slate-500"><X className="w-4 h-4 text-red-400" /> Manually ask</div>, agency: <div className="flex items-center gap-2 justify-center text-slate-500"><AlertCircle className="w-4 h-4 text-yellow-500" /> Email campaigns</div>, limbu: <div className="flex items-center gap-2 justify-center text-slate-900 font-bold"><CheckCircle2 className="w-4 h-4 text-green-500" /> Magic QR</div> },
    { feature: "Local keyword SEO", manual: <div className="flex items-center gap-2 justify-center text-slate-500"><X className="w-4 h-4 text-red-400" /> No expertise</div>, agency: <div className="flex items-center gap-2 justify-center text-slate-500"><AlertCircle className="w-4 h-4 text-yellow-500" /> Monthly report</div>, limbu: <div className="flex items-center gap-2 justify-center text-slate-900 font-bold"><CheckCircle2 className="w-4 h-4 text-green-500" /> Real-time AI</div> },
    { feature: "Setup time", manual: <div className="flex items-center gap-2 justify-center text-slate-500"><X className="w-4 h-4 text-red-400" /> Never fully done</div>, agency: <div className="flex items-center gap-2 justify-center text-slate-500"><AlertCircle className="w-4 h-4 text-yellow-500" /> 2–4 weeks</div>, limbu: <div className="flex items-center gap-2 justify-center text-slate-900 font-bold"><CheckCircle2 className="w-4 h-4 text-green-500" /> Under 24 hours</div> },
    { feature: "Monthly cost", manual: <div className="flex items-center gap-2 justify-center text-slate-500 font-medium">₹0 (your time = ₹20k+)</div>, agency: <div className="flex items-center gap-2 justify-center text-slate-500 font-medium">₹15,000–₹50,000</div>, limbu: <div className="flex items-center gap-2 justify-center text-slate-900 font-extrabold text-base">₹4,999/mo</div> },
  ];
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl bg-white relative">
      <div className="absolute top-0 right-0 w-1/4 h-full bg-yellow-50/50 pointer-events-none" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px] relative z-10">
          <thead>
            <tr>
              <th className="text-left px-6 py-6 font-extrabold text-slate-900 border-b-2 border-slate-100 bg-white w-1/4">Comparison Feature</th>
              <th className="px-6 py-6 font-bold text-slate-500 border-b-2 border-slate-100 bg-slate-50/50 text-center w-1/4">DIY (Manual)</th>
              <th className="px-6 py-6 font-bold text-slate-500 border-b-2 border-slate-100 bg-slate-50/50 text-center w-1/4">Local Agency</th>
              <th className="px-6 py-6 font-extrabold text-slate-900 border-b-4 border-yellow-400 bg-yellow-100/50 text-center w-1/4 shadow-[0_4px_15px_-3px_rgba(250,204,21,0.2)]">
                Limbu AI <Star className="inline-block w-4 h-4 fill-yellow-400 text-yellow-400 ml-1 mb-1" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-5 font-bold text-slate-800 bg-white">{r.feature}</td>
                <td className="px-6 py-5 bg-slate-50/20 group-hover:bg-slate-50/50 transition-colors">{r.manual}</td>
                <td className="px-6 py-5 bg-slate-50/20 group-hover:bg-slate-50/50 transition-colors">{r.agency}</td>
                <td className="px-6 py-5 bg-yellow-50/30 group-hover:bg-yellow-50/60 transition-colors border-l border-r border-yellow-100/50">{r.limbu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── PRICING CARDS ───────────────────────────────────────────── */
const PLANS = [
  {
    name: "Basic Plan",
    price: 2500,
    desc: "Ideal for small businesses needing basic online presence",
    features: [
      "15 GMB Posts / month",
      "5 Citations / month",
      "Review Reply System",
      "Magic QR Code Generation",
      "Insights Dashboard",
      "Category Addition & Optimization",
      "Website Builder"
    ],
    missing: ["Add Professional Services", "Advanced Keyword SEO"],
    cta: "Choose Basic",
    href: "/pricing",
    popular: false,
  },
  {
    name: "Professional Plan",
    price: 5500,
    desc: "Best for growing businesses looking for better visibility",
    features: [
      "30 GMB Posts / month",
      "12 Citations / month",
      "Review Reply Management",
      "Magic QR Code Generation",
      "Insights Dashboard",
      "Category Addition & Optimization",
      "Website Builder"
    ],
    missing: ["Add Professional Services"],
    cta: "Choose Professional",
    href: "/pricing",
    popular: false,
  },
  {
    name: "Premium Plan",
    price: 7500,
    desc: "Perfect for brands focused on automation and maximum reach",
    features: [
      "45 GMB Posts / month",
      "15 Citations / month",
      "Review Reply Management",
      "Magic QR Code Generation",
      "Insights Dashboard",
      "Category Addition & Optimization",
      "Website Builder",
      "Add Professional Services"
    ],
    missing: [],
    cta: "Start Premium →",
    href: "/pricing",
    popular: true,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-12 md:py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-100 px-3 py-1 rounded-full">Transparent Pricing</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-6 mb-4">Simple Plans. No Hidden Fees.</h2>
          <p className="text-slate-600 text-lg">Choose the package that suits your business needs.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative flex flex-col bg-white rounded-[2rem] p-8 transition-all duration-300 ${plan.popular ? "border-2 border-yellow-400 shadow-2xl scale-105 md:-mt-8 md:mb-8 z-10" : "border border-slate-200 shadow-lg hover:shadow-xl"}`}>
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-sm font-bold px-5 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  ⭐ Most Popular
                </div>
              )}
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium h-10">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl md:text-5xl font-extrabold text-slate-900">₹{plan.price.toLocaleString()}</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <p className="text-xs font-bold text-slate-400 mb-8 pb-8 border-b border-slate-100">+ 18% GST</p>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0" /> {f}
                  </li>
                ))}
                {plan.missing.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-400">
                    <Minus className="w-5 h-5 text-slate-300 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href={plan.href} className={`block w-full text-center py-4 rounded-xl font-bold text-sm transition-all mt-auto ${plan.popular ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"}`}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-12 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-5 h-5 text-green-500" /> Proceed to the pricing page to securely book your plan.
        </p>
      </div>
    </section>
  );
}

/* ─── PROBLEM SECTION ─────────────────────────────────────────── */
function ProblemSection({ cityName }) {
  const problems = [
    { icon: <Search className="w-5 h-5" />, text: `Your competitor is #1 on Google Maps — you're stuck on page 2.` },
    { icon: <Star className="w-5 h-5" />, text: "Asking for reviews feels awkward, so your rating stays low." },
    { icon: <Clock className="w-5 h-5" />, text: "You don't have time to update and manage your GMB profile daily." },
    { icon: <TrendingDown className="w-5 h-5" />, text: "You're paying an agency thousands per month with zero ROI." },
  ];
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">90% of {cityName} Business Owners <br className="hidden md:block" />Are Making These Mistakes</h2>
          <p className="text-slate-500 mt-4 text-lg">Are you facing any of these challenges?</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          {problems.map((p, i) => (
            <div key={i} className="flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 flex-shrink-0">
                {p.icon}
              </div>
              <p className="text-slate-700 font-medium leading-relaxed mt-0.5">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg">
            <Zap className="w-8 h-8 text-slate-900" />
          </div>
          <div className="flex-1 text-center sm:text-left relative z-10">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Limbu AI Solves All These Problems</h3>
            <p className="text-slate-400">Setup once and let the AI handle everything — on autopilot, 24/7.</p>
          </div>
          <a href={WA} className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-8 py-4 rounded-full text-sm transition-colors shadow-[0_0_20px_rgba(250,204,21,0.3)] relative z-10">
            Get My Free Audit →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── BEFORE / AFTER SECTION ──────────────────────────────────── */
function BeforeAfterSection({ cityName }) {
  const items = [
    { label: "Profile views/mo", before: "120", after: "1,400", metric: "+1066%" },
    { label: "Reviews count", before: "8 (3.6★)", after: "94 (4.8★)", metric: "+1075%" },
    { label: "Calls from Google", before: "3/week", after: "28/week", metric: "+833%" },
    { label: "Maps Ranking", before: "Page 2–3", after: "Top 3", metric: "🏆 #1" },
  ];
  return (
    <section className="py-8 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-3 py-1 rounded-full">Real Results</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-3">See the Difference in Just 30 Days</h2>
          <p className="text-slate-500 text-lg">Actual data from a {cityName} client (Before vs After Limbu AI)</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Before */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm opacity-80">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Before (Manual DIY)</h3>
                <p className="text-xs text-slate-500">Struggling for visibility</p>
              </div>
            </div>
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="text-slate-700 font-bold">{item.before}</span>
                </div>
              ))}
            </div>
          </div>
          {/* After */}
          <div className="bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/20 blur-3xl rounded-full" />
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-700 relative z-10">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                <CheckCircle2 className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">After (Limbu AI)</h3>
                <p className="text-xs text-yellow-400">Dominating local search</p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">{item.after}</span>
                    <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">{item.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST BADGES ─── */
function TrustSection({ cityName }) {
  const badges = [
    { icon: <BadgeCheck className="w-5 h-5 text-blue-500" />, label: "Google Partner" },
    { icon: <ShieldCheck className="w-5 h-5 text-green-500" />, label: "Data Secure" },
    { icon: <ThumbsUp className="w-5 h-5 text-yellow-500" />, label: "4.9★ Rated" },
    { icon: <Building2 className="w-5 h-5 text-slate-500" />, label: "500+ Local Brands" },
  ];
  return (
    <div className="py-6 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trusted by industry leaders in {cityName}</p>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-100">
              {b.icon} {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── VIDEO / DEMO SECTION ────────────────────────────────────── */
function DemoSection({ dashboardImg }) {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-100 px-3 py-1 rounded-full">Platform Demo</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-6 mb-3">Watch How It Works</h2>
          <p className="text-slate-500 text-lg">Understand why Limbu AI is the best choice for local growth in 2 minutes.</p>
        </div>
        <div
          onClick={() => setPlaying(true)}
          className="relative rounded-[2rem] overflow-hidden shadow-2xl cursor-pointer group border-4 border-white"
        >
          <img src={dashboardImg || DEFAULT_IMAGES.dashboard} alt="Dashboard demo" className="w-full h-64 md:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/50 transition-colors flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-300 mb-6">
              <Play className="w-10 h-10 text-slate-900 ml-2" fill="currentColor" />
            </div>
            <p className="text-white font-bold text-xl drop-shadow-md">Watch Live Demo</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 text-center max-w-3xl mx-auto">
          {[["2 Min", "Setup time"], ["24 Hrs", "Profile goes live"], ["30 Days", "Measurable ROI"]].map(([v, l]) => (
            <div key={l} className="bg-white rounded-2xl py-5 border border-slate-100 shadow-sm">
              <p className="text-xl md:text-2xl font-extrabold text-slate-900">{v}</p>
              <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CASE STUDIES ────────────────────────────────────────────── */
function CaseStudiesSection({ cityName, caseStudies = [] }) {
  const defaultCases = [
    {
      img: DEFAULT_IMAGES.restaurant,
      category: "Restaurant",
      location: "Cyber Hub",
      name: "Spice Route",
      result: "+340% walk-ins",
      desc: `Monthly Google calls increased from 12 to 89. Weekend footfall more than doubled.`,
    },
    {
      img: DEFAULT_IMAGES.clinic,
      category: "Clinic",
      location: "Sector 29",
      name: "Smile Dental",
      result: "#1 on Google Maps",
      desc: "Ranked #1 for 'Dentist near me' searches. 67 new patients in just 30 days.",
    },
    {
      img: DEFAULT_IMAGES.retail,
      category: "Retail",
      location: "MG Road",
      name: "The Fashion Hub",
      result: "+520% profile views",
      desc: "Review count grew from 11 to 103. Overall rating improved from 3.9 to 4.8.",
    },
  ];

  const displayCases = caseStudies.length > 0 ? caseStudies : defaultCases;

  return (
    <section className="py-12 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{cityName} Business Success Stories</h2>
          <p className="text-slate-400 text-lg">Local heroes who scaled their growth with Limbu AI.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {displayCases.map((c, i) => (
            <div key={i} className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 hover:border-yellow-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.1)] group">
              <div className="relative h-56 overflow-hidden">
                <img src={c.img || c.imgUrl || DEFAULT_IMAGES.restaurant} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <div className="absolute top-4 left-4 bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">{c.category}</div>
                <div className="absolute bottom-4 left-5 right-5">
                  <p className="text-yellow-400 font-extrabold text-2xl leading-tight mb-1">{c.result}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-sm font-medium">{c.location}</span>
                  <span className="text-slate-600 text-sm mx-1">·</span>
                  <span className="text-white text-sm font-bold">{c.name}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">{c.desc}</p>
                <a href={WA} className="inline-flex items-center gap-1.5 text-yellow-400 text-sm font-bold hover:text-yellow-300 transition-colors group-hover:underline underline-offset-4">
                  Get similar results <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── GUARANTEE SECTION ───────────────────────────────────────── */
function GuaranteeSection() {
  return (
    <section className="py-10 bg-yellow-50 border-y border-yellow-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mx-auto mb-6 border-4 border-yellow-100">
          <ShieldCheck className="w-12 h-12 text-yellow-500" />
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">100% Risk-Free Guarantee</h2>
        <p className="text-slate-700 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto font-medium">
          If you don't see at least <strong>2x growth</strong> in your Google Business Profile views within 30 days,
          we will <strong>fully refund</strong> your payment — no questions asked.
        </p>
        <div className="flex flex-wrap justify-center gap-3 md:gap-5">
          {["14-day free trial", "No contract lock-in", "Full refund guarantee", "Cancel anytime"].map(t => (
            <div key={t} className="flex items-center gap-2 bg-white border border-yellow-200 rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-yellow-500" /> {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function DynamicServiceCityPage({ params }) {
  const resolvedParams = use(params);
  const citySlug = resolvedParams.city;

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle prefix "google-bussiness-service-" if present for fallback cityName
  const prefix = "google-bussiness-service-";
  const rawCity = citySlug.startsWith(prefix)
    ? citySlug.slice(prefix.length)
    : citySlug;

  const cityNameFallback = rawCity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const cityName = pageData?.cityName || cityNameFallback;

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/city-services/${citySlug}`);
      if (res.data.success) {
        setPageData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch city service data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [citySlug]);

  useEffect(() => {
    if (pageData || cityName) {
      document.title = pageData?.metaTitle || `${cityName} | Google Business Management Service`;

      // Update meta description if possible (limited on client side without extra libs)
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", pageData?.metaDescription || `Rank #1 on Google Maps in ${cityName}.`);
      }
    }
  }, [pageData, cityName]);
  const [openFaq, setOpenFaq] = useState(0);

  const features = [
    { icon: <Zap className="w-6 h-6 text-yellow-600" />, title: "Automated GMB Posts", description: `AI-generated, high-quality daily updates tailored for your ${cityName} audience. Consistency is key to ranking.` },
    { icon: <Star className="w-6 h-6 text-yellow-600" />, title: "Magic QR for Reviews", description: "Place our smart QR in your store. Customers scan and leave an instant 5-star Google review. Effortless." },
    { icon: <TrendingUp className="w-6 h-6 text-yellow-600" />, title: "Local Keyword SEO", description: "Our AI identifies exactly what your local customers are searching for and optimizes your profile accordingly." },
    { icon: <MessageCircle className="w-6 h-6 text-yellow-600" />, title: "Instant AI Replies", description: "Limbu AI responds to every review instantly, improving your engagement rate and customer trust." },
  ];

  const testimonials = pageData?.testimonials?.length > 0 ? pageData.testimonials : [
    { rating: 5, verified: true, text: `Limbu AI transformed our business in ${cityName}. We now get 3-4 calls every day just from Google Maps!`, name: "Rajesh Kumar", role: "Restaurant Owner" },
    { rating: 5, verified: true, text: "The Magic QR is a game changer. We collected 50+ reviews in our first month. Highly recommended!", name: "Anjali Sharma", role: "Clinic Manager" },
    { rating: 5, verified: true, text: "Finally an automation tool that actually works. Our ranking moved from page 3 to the top 3 spots.", name: "Vikram Singh", role: "Retail Store Owner" },
  ];

  const faqs = pageData?.faqs?.length > 0 ? pageData.faqs : [
    { question: "How long does it take to see results?", answer: `Most businesses in ${cityName} see a measurable increase in profile views and calls within the first 14-21 days.` },
    { question: "Do I need to give you my Google password?", answer: "No. You simply invite our secure platform to manage your listing as a 'Manager'. You retain full ownership." },
    { question: "What is the 'Magic QR' code?", answer: "It's a custom-branded QR code we provide. When scanned by customers, it takes them directly to your review page with a 5-star pre-selected." },
    { question: "Is there a setup fee?", answer: "No. We believe in our results, so we don't charge any hidden setup or onboarding fees. Just one simple monthly price." },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading {cityName} local SEO dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HeaderSection />
      <UrgencyBanner cityName={cityName} />
      <StickyBar />

      <main>
        {/* ── HERO SECTION ── */}
        <section className="relative pt-12 md:pt-20 pb-16 md:pb-32 overflow-hidden bg-white">
          <div className="absolute inset-0 z-0">
            <img src={pageData?.heroImageUrl || DEFAULT_IMAGES.hero} alt={`${cityName} Local SEO`} className="w-full h-full object-cover opacity-10 scale-105" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-200 rounded-full px-4 py-2 text-yellow-800 text-sm font-bold mb-6 shadow-sm">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {cityName}'s #1 GMB Automation Tool
                </div>
                <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                  {pageData?.heroHeading || `Rank #1 on Google in ${cityName} — Automatically.`}
                </h1>
                <p className="text-lg md:text-2xl text-slate-600 mb-10 leading-relaxed font-medium">
                  {pageData?.heroSubheading || `We use AI to optimize your Google Business Profile daily, generate 5-star reviews, and dominate your local competition in ${cityName}.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href={WA} className="inline-flex justify-center items-center gap-2 bg-yellow-400 text-slate-900 px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-[0_4px_20px_rgba(250,204,21,0.4)]">
                    Get 500 Coins for Free <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#demo" className="inline-flex justify-center items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    <Play className="w-5 h-5" /> Watch Demo
                  </a>
                </div>
                <div className="mt-8 flex items-center gap-6 text-slate-500 font-medium">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> No Setup Fee</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Cancel Anytime</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-slate-800 rounded-[2rem] p-4 border border-slate-700 shadow-2xl">
                  <img src={DEFAULT_IMAGES.dashboard} alt="Limbu AI Dashboard" className="rounded-2xl shadow-inner" />
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 hidden md:block animate-bounce-slow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Growth This Month</p>
                        <p className="text-xl font-black text-slate-900">+342%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST SECTION ── */}
        <TrustSection cityName={cityName} />

        {/* ── STATS SECTION ── */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
              <StatCard target={pageData?.postsAutomated || 10000} suffix="+" label="Posts Automated" />
              <StatCard target={pageData?.reviewsGenerated || 50000} suffix="+" label="Reviews Generated" />
              <StatCard target={pageData?.businessesServed || 500} suffix="+" label="Local Businesses" />
              <StatCard target={pageData?.avgProfileGrowth || 340} suffix="%" label="Avg. Growth" />
            </div>
          </div>
        </section>

        {/* ── PROBLEM SECTION ── */}
        <ProblemSection cityName={cityName} />

        {/* ── FEATURES SECTION ── */}
        <section id="features" className="py-8 md:py-12 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-3 py-1 rounded-full">Core Features</span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-6 mb-4">Everything You Need to Rank #1</h2>
              <p className="text-slate-600 text-lg font-medium">Why waste time on manual updates when AI can do it 10x better and faster?</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-yellow-200 transition-all duration-300">
                  <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BEFORE/AFTER ── */}
        <BeforeAfterSection cityName={cityName} />

        {/* ── DEMO ── */}
        <div id="demo">
          <DemoSection dashboardImg={DEFAULT_IMAGES.dashboard} />
        </div>

        {/* ── ROI/CALCULATOR ── */}
        <section className="py-8 md:py-12 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                  Calculate Your <span className="text-yellow-400">Growth Potential</span>
                </h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                  Local SEO isn't just about 'ranking'. It's about revenue. Use our tool to see how much more you could be making with Limbu AI.
                </p>
                <div className="space-y-5 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  {[
                    `Average ${cityName} clients gain 2.8x more customers`,
                    "Profile views typically increase by 300–500%",
                    "Most businesses break even within the first week",
                    "Average 3x ROI across our entire client base",
                  ].map(t => (
                    <div key={t} className="flex items-start gap-3 text-slate-300 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" /> {t}
                    </div>
                  ))}
                </div>
              </div>
              <ROICalculator />
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="py-14 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Limbu AI vs Alternatives</h2>
              <p className="text-slate-500 text-lg font-medium">Decide for yourself — the numbers and facts speak for themselves.</p>
            </div>
            <ComparisonTable />
          </div>
        </section>

        {/* ── CASE STUDIES ── */}
        <CaseStudiesSection cityName={cityName} caseStudies={pageData?.caseStudies} />

        {/* ── TESTIMONIALS ── */}
        <section id="reviews" className="py-14 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-100 px-3 py-1 rounded-full">Client Reviews</span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-6">Real Words, Real Results</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 relative hover:shadow-xl hover:border-yellow-300 transition-all duration-300 group">
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-100 group-hover:text-yellow-100 transition-colors" />
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                    {t.verified && <span className="ml-2 text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>}
                  </div>
                  <p className="text-slate-700 mb-6 italic leading-relaxed font-medium">"{t.text}"</p>
                  <div className="flex items-center gap-4 border-t border-slate-100 pt-5">
                    <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                      <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs font-medium text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GUARANTEE ── */}
        <GuaranteeSection />

        {/* ── FAQ ── */}
        <section id="faq" className="py-14 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-500 text-lg font-medium">Have a question? Ask us on WhatsApp — we usually reply within 5 minutes.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === i ? "bg-slate-50 shadow-md border-yellow-400" : "bg-white border-slate-100 hover:border-slate-200"}`}>
                  <button className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    <span className="font-bold text-slate-900 pr-4">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-yellow-500" : ""}`} />
                  </button>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-slate-600 font-medium leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-8 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
          </div>
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-yellow-400/30 rounded-full px-5 py-2.5 text-yellow-400 text-sm font-bold mb-8 shadow-lg backdrop-blur-sm">
              <Flame className="w-4 h-4" /> Only 7 spots left this month
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-6 leading-tight drop-shadow-md">
              It's Time to Become {cityName}'s Top Choice
            </h2>
            <p className="text-lg md:text-xl text-slate-300 mb-10 font-medium max-w-2xl mx-auto">
              Your competitors are already using local SEO. Every day you wait, you're losing ready-to-buy customers to them.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <a href={WA} className="inline-flex justify-center items-center gap-2 bg-yellow-400 text-slate-900 px-10 py-5 rounded-full font-extrabold text-lg hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                Claim Your Free Audit <ArrowRight className="w-6 h-6" />
              </a>
              <a href="tel:+919289344726" className="inline-flex justify-center items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/20 transition-all">
                <Phone className="w-5 h-5" /> Call Us Now
              </a>
            </div>
            <p className="mt-8 text-sm text-slate-400 flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
