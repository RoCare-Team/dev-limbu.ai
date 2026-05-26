import React from "react";
import {
  MapPin,
  TrendingUp,
  Star,
  Zap,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Quote,
  ShieldCheck,
  X,
  Phone,
  Clock,
  BadgeCheck,
  BarChart3,
  ThumbsUp,
  AlertCircle,
  Search,
  Award,
  Building2,
  Flame,
  ChevronRight,
  Calculator,
  Target,
  IndianRupee,
  TrendingDown,
  Minus,
} from "lucide-react";

import Image from "next/image";
import Navbar from "../sections/HeaderSection";

import FooterSection from "../sections/FooterSection";
import VideoModal from "../modals/VideoModal";
import WatchDemoButton from "../ui/WatchDemoButton";
import {
  StickyBar,
  StatCard,
  ROICalculator,
  CityFaqAccordion,
  DemoSection,
} from "./CityPageInteractive";
import Link from "next/link";

/* ─── IMAGES ─────────────────────────────────────────────────── */
const DEFAULT_IMAGES = {
  hero: "/images/city-page/hero.png",
  dashboard:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
  localMap:
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800",
  restaurant:
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400",
  clinic:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400",
  retail:
    "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=400",
};

/* ─── WHATSAPP CTA URL ────────────────────────────────────────── */
const WA = "https://wa.me/919289344726";

/* ─── URGENCY BANNER ──────────────────────────────────────────── */
function UrgencyBanner({ cityName }) {
  const spots = 7;
  return (
    <div className="bg-slate-900 text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 flex-wrap border-b border-slate-800">
      <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
        <Flame className="w-4 h-4 animate-pulse" />
        <span>Only {spots} spots left this month!</span>
      </div>
      <span className="hidden sm:inline text-slate-400">|</span>
      <span className="text-slate-300">
        Special offer for {cityName} businesses.
      </span>
      <a
        href={WA}
        className="text-yellow-400 font-bold hover:text-yellow-300 underline underline-offset-2 ml-1"
      >
        Claim Now →
      </a>
    </div>
  );
}

/* ─── COMPARISON TABLE ────────────────────────────────────────── */
function ComparisonTable({ cityName }) {
  const rows = [
    {
      feature: "Google Posts (daily)",
      manual: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <X className="w-4 h-4 text-red-400" /> Takes 30 min/day
        </div>
      ),
      agency: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <AlertCircle className="w-4 h-4 text-yellow-500" /> Weekly only
        </div>
      ),
      limbu: (
        <div className="flex items-center gap-2 justify-center text-slate-900 font-bold">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> AI daily auto
        </div>
      ),
    },
    {
      feature: "Review replies",
      manual: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <X className="w-4 h-4 text-red-400" /> Often ignored
        </div>
      ),
      agency: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <AlertCircle className="w-4 h-4 text-yellow-500" /> Slow (1–2 days)
        </div>
      ),
      limbu: (
        <div className="flex items-center gap-2 justify-center text-slate-900 font-bold">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> Instant AI
        </div>
      ),
    },
    {
      feature: "5-star review collection",
      manual: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <X className="w-4 h-4 text-red-400" /> Manually ask
        </div>
      ),
      agency: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <AlertCircle className="w-4 h-4 text-yellow-500" /> Email campaigns
        </div>
      ),
      limbu: (
        <div className="flex items-center gap-2 justify-center text-slate-900 font-bold">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> Magic QR
        </div>
      ),
    },
    {
      feature: "Local keyword SEO",
      manual: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <X className="w-4 h-4 text-red-400" /> No expertise
        </div>
      ),
      agency: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <AlertCircle className="w-4 h-4 text-yellow-500" /> Monthly report
        </div>
      ),
      limbu: (
        <div className="flex items-center gap-2 justify-center text-slate-900 font-bold">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> Real-time AI
        </div>
      ),
    },
    {
      feature: "Setup time",
      manual: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <X className="w-4 h-4 text-red-400" /> Never fully done
        </div>
      ),
      agency: (
        <div className="flex items-center gap-2 justify-center text-slate-500">
          <AlertCircle className="w-4 h-4 text-yellow-500" /> 2–4 weeks
        </div>
      ),
      limbu: (
        <div className="flex items-center gap-2 justify-center text-slate-900 font-bold">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> Under 24 hours
        </div>
      ),
    },
    {
      feature: "Monthly cost",
      manual: (
        <div className="flex items-center gap-2 justify-center text-slate-500 font-medium">
          ₹0 (your time = ₹20k+)
        </div>
      ),
      agency: (
        <div className="flex items-center gap-2 justify-center text-slate-500 font-medium">
          ₹15,000–₹50,000
        </div>
      ),
      limbu: (
        <div className="flex items-center gap-2 justify-center text-slate-900 font-extrabold text-base">
          ₹4,999/mo
        </div>
      ),
    },
  ];
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl bg-white relative">
      <div className="absolute top-0 right-0 w-1/4 h-full bg-yellow-50/50 pointer-events-none" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px] relative z-10">
          <thead>
            <tr>
              <th className="text-left px-6 py-6 font-extrabold text-slate-900 border-b-2 border-slate-100 bg-white w-1/4">
                Comparison for {cityName}
              </th>
              <th className="px-6 py-6 font-bold text-slate-500 border-b-2 border-slate-100 bg-slate-50/50 text-center w-1/4">
                DIY (Manual)
              </th>
              <th className="px-6 py-6 font-bold text-slate-500 border-b-2 border-slate-100 bg-slate-50/50 text-center w-1/4">
                Local Agency
              </th>
              <th className="px-6 py-6 font-extrabold text-slate-900 border-b-4 border-yellow-400 bg-yellow-100/50 text-center w-1/4 shadow-[0_4px_15px_-3px_rgba(250,204,21,0.2)]">
                Limbu AI{" "}
                <Star className="inline-block w-4 h-4 fill-yellow-400 text-yellow-400 ml-1 mb-1" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr
                key={i}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="px-6 py-5 font-bold text-slate-800 bg-white">
                  {r.feature}
                </td>
                <td className="px-6 py-5 bg-slate-50/20 group-hover:bg-slate-50/50 transition-colors">
                  {r.manual}
                </td>
                <td className="px-6 py-5 bg-slate-50/20 group-hover:bg-slate-50/50 transition-colors">
                  {r.agency}
                </td>
                <td className="px-6 py-5 bg-yellow-50/30 group-hover:bg-yellow-50/60 transition-colors border-l border-r border-yellow-100/50">
                  {r.limbu}
                </td>
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
      "Website Builder",
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
      "Website Builder",
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
      "Add Professional Services",
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
          <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-100 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-6 mb-4">
            Simple Plans. No Hidden Fees.
          </h2>
          <p className="text-slate-600 text-lg">
            Choose the package that suits your business needs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col bg-white rounded-[2rem] p-8 transition-all duration-300 ${plan.popular ? "border-2 border-yellow-400 shadow-2xl scale-105 md:-mt-8 md:mb-8 z-10" : "border border-slate-200 shadow-lg hover:shadow-xl"}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-sm font-bold px-5 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  ⭐ Most Popular
                </div>
              )}
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium h-10">
                {plan.desc}
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl md:text-5xl font-extrabold text-slate-900">
                  ₹{plan.price.toLocaleString()}
                </span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <p className="text-xs font-bold text-slate-400 mb-8 pb-8 border-b border-slate-100">
                + 18% GST
              </p>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-slate-700 font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0" />{" "}
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-slate-400"
                  >
                    <Minus className="w-5 h-5 text-slate-300 flex-shrink-0" />{" "}
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`block w-full text-center py-4 rounded-xl font-bold text-sm transition-all mt-auto ${plan.popular ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-12 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-5 h-5 text-green-500" /> Proceed to the
          pricing page to securely book your plan.
        </p>
      </div>
    </section>
  );
}

/* ─── PROBLEM SECTION ─────────────────────────────────────────── */
function ProblemSection({ cityName }) {
  const problems = [
    {
      icon: <Search className="w-5 h-5" />,
      text: `Your competitor is #1 on Google Maps — you're stuck on page 2.`,
    },
    {
      icon: <Star className="w-5 h-5" />,
      text: "Asking for reviews feels awkward, so your rating stays low.",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: "You don't have time to update and manage your GMB profile daily.",
    },
    {
      icon: <TrendingDown className="w-5 h-5" />,
      text: "You're paying an agency thousands per month with zero ROI.",
    },
  ];
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            90% of {cityName} Business Owners <br className="hidden md:block" />
            Are Making These Mistakes
          </h2>
          <p className="text-slate-500 mt-4 text-lg">
            Are you facing any of these challenges?
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          {problems.map((p, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 flex-shrink-0">
                {p.icon}
              </div>
              <p className="text-slate-700 font-medium leading-relaxed mt-0.5">
                {p.text}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shrink-0 relative z-10 shadow-lg">
            <Zap className="w-8 h-8 text-slate-900" />
          </div>
          <div className="flex-1 text-center sm:text-left relative z-10">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Limbu AI Solves All These Problems
            </h3>
            <p className="text-slate-400">
              Setup once and let the AI handle everything — on autopilot, 24/7.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-8 py-4 rounded-full text-sm transition-colors shadow-[0_0_20px_rgba(250,204,21,0.3)] relative z-10"
          >
            Get My Free Audit →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── BEFORE / AFTER SECTION ──────────────────────────────────── */
function BeforeAfterSection({ cityName }) {
  const items = [
    {
      label: "Profile views/mo",
      before: "120",
      after: "1,400",
      metric: "+1066%",
    },
    {
      label: "Reviews count",
      before: "8 (3.6★)",
      after: "94 (4.8★)",
      metric: "+1075%",
    },
    {
      label: "Calls from Google",
      before: "3/week",
      after: "28/week",
      metric: "+833%",
    },
    {
      label: "Maps Ranking",
      before: "Page 2–3",
      after: "Top 3",
      metric: "🏆 #1",
    },
  ];
  return (
    <section className="py-8 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-3 py-1 rounded-full">
            Real Results
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-3">
            See the Difference in Just 30 Days
          </h2>
          <p className="text-slate-500 text-lg">
            Actual data from a {cityName} client (Before vs After Limbu AI)
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Before */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm opacity-80">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Before (Manual DIY)
                </h3>
                <p className="text-xs text-slate-500">
                  Struggling for visibility
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">
                    {item.label}
                  </span>
                  <span className="text-slate-700 font-bold">
                    {item.before}
                  </span>
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
                <h3 className="font-bold text-white text-lg">
                  After (Limbu AI)
                </h3>
                <p className="text-xs text-yellow-400">
                  Dominating local search
                </p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0"
                >
                  <span className="text-slate-300 font-medium">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">
                      {item.after}
                    </span>
                    <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                      {item.metric}
                    </span>
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
    {
      icon: <BadgeCheck className="w-5 h-5 text-blue-500" />,
      label: "Google Partner",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
      label: "Data Secure",
    },
    {
      icon: <ThumbsUp className="w-5 h-5 text-yellow-500" />,
      label: "4.9★ Rated",
    },
    {
      icon: <Building2 className="w-5 h-5 text-slate-500" />,
      label: "500+ Local Brands",
    },
  ];
  return (
    <div className="py-6 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Trusted by industry leaders in {cityName}
        </p>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {badges.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-100"
            >
              {b.icon} {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── CASE STUDIES ────────────────────────────────────────────── */
function CaseStudiesSection({ cityName, caseStudies = [] }) {
  const defaultCases = [
    {
      img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800",
      category: "Restaurant",
      location: cityName,
      name: "Moti Mahal Delux",
      result: "+280% Monthly Calls",
      desc: `By optimizing their GMB for 'Best Butter Chicken', we helped this iconic brand capture 3x more local intent searches in ${cityName}.`,
    },
    {
      img: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
      category: "Healthcare",
      location: cityName,
      name: "Clove Dental",
      result: "Top 3 Map Ranking",
      desc: "Automated review collection helped their clinics maintain a 4.8★ rating across 300+ locations, significantly boosting patient walk-ins.",
    },
    {
      img: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=800",
      category: "Retail",
      location: cityName,
      name: "Fabindia",
      result: "+450% Profile Views",
      desc: "Daily automated posts showcasing new collections led to a massive surge in 'Directions' requests from local shoppers.",
    },
  ];

  const displayCases = caseStudies.length > 0 ? caseStudies : defaultCases;

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-400/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-600 text-sm font-bold mb-4 uppercase tracking-widest">
            Success Stories
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            How {cityName} Brands{" "}
            <span className="text-yellow-600 underline decoration-yellow-400/30 underline-offset-8">
              Scale Faster
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
            Real results from businesses that automated their growth and
            dominated their competition with Limbu AI.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {displayCases.map((c, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 hover:border-yellow-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={c.img || c.imgUrl || DEFAULT_IMAGES.restaurant}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                {/* Result Badge */}
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="inline-flex items-center gap-2 bg-yellow-400 text-slate-950 font-black px-4 py-2 rounded-xl text-lg shadow-lg">
                    <TrendingUp className="w-5 h-5" />
                    {c.result}
                  </div>
                </div>

                {/* Category Chip */}
                <div className="absolute top-4 left-6">
                  <span className="bg-white/90 backdrop-blur-md border border-slate-200 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">
                    {c.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <MapPin className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-slate-500 text-sm font-bold tracking-wide uppercase">
                    {c.location}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-yellow-600 transition-colors">
                  {c.name}
                </h3>

                <p className="text-slate-600 leading-relaxed font-medium mb-4 min-h-[4.5rem]">
                  "{c.desc}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── GUARANTEE SECTION ───────────────────────────────────────── */
function GuaranteeSection({ cityName }) {
  return (
    <section className="py-10 bg-yellow-400 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-8 transform -rotate-3 border-4 border-yellow-300">
          <ShieldCheck className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          100% Risk-Free Guarantee
        </h2>
        <p className="text-slate-800 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
          If you don't see at least{" "}
          <span className="font-black border-b-2 border-slate-900">
            2x growth
          </span>{" "}
          in your Google Business Profile views in {cityName} within 30 days, we
          will{" "}
          <span className="font-black border-b-2 border-slate-900">
            fully refund
          </span>{" "}
          your payment — no questions asked.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            "14-Day Free Trial",
            "No Contract Lock-in",
            "Full Refund Guarantee",
            "Cancel Anytime",
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 bg-slate-900 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-xl hover:scale-105 transition-transform cursor-default"
            >
              <CheckCircle2 className="w-4 h-4 text-yellow-400" /> {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function DynamicServiceCityPage({
  city,
  slug,
  pageData,
}) {
  const citySlug = slug;

  // Handle city service prefixes
  const prefixes = [
    "google-bussiness-profile-management-",
    "google-bussiness-service-",
    "local-seo-",
  ];

  const matchedPrefix = prefixes.find((prefix) => citySlug.startsWith(prefix));

  const rawCity = matchedPrefix
    ? citySlug.slice(matchedPrefix.length)
    : citySlug;

  const cityNameFallback = rawCity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Ensure cityName is capitalized
  const capitalize = (str) =>
    str
      ?.split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // Final city name
  const cityName = capitalize(pageData?.cityName) || cityNameFallback;

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: "Automated GMB Posts",
      description: `AI-generated, high-quality daily updates tailored for your ${cityName} audience. Consistency is key to ranking.`,
    },
    {
      icon: <Star className="w-6 h-6 text-yellow-600" />,
      title: "Magic QR for Reviews",
      description:
        "Place our smart QR in your store. Customers scan and leave an instant 5-star Google review. Effortless.",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-yellow-600" />,
      title: "Local Keyword SEO",
      description:
        "Our AI identifies exactly what your local customers are searching for and optimizes your profile accordingly.",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-yellow-600" />,
      title: "Instant AI Replies",
      description:
        "Limbu AI responds to every review instantly, improving your engagement rate and customer trust.",
    },
  ];

  const testimonials =
    pageData?.testimonials?.length > 0
      ? pageData.testimonials
      : [
          {
            rating: 5,
            verified: true,
            text: `Limbu AI transformed our business in ${cityName}. We now get 3-4 calls every day just from Google Maps!`,
            name: "Amit Sharma",
            role: "Sweet Shop Owner",
            img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200", // Indian man portrait
          },
          {
            rating: 5,
            verified: true,
            text: "The Magic QR is a game changer. We collected 50+ reviews in our first month. Highly recommended!",
            name: "Sneha Kapoor",
            role: "Salon Owner",
            img: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=200&h=200", // Indian woman portrait
          },
          {
            rating: 5,
            verified: true,
            text: "Finally an automation tool that actually works. Our ranking moved from page 3 to the top 3 spots.",
            name: "Rahul Verma",
            role: "Electronics Store",
            img: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=200&h=200", // Indian man portrait
          },
        ];

  const faqs =
    pageData?.faqs?.length > 0
      ? pageData.faqs
      : [
          {
            question: "How long does it take to see results?",
            answer: `Most businesses in ${cityName} see a measurable increase in profile views and calls within the first 14-21 days.`,
          },
          {
            question: "Do I need to give you my Google password?",
            answer:
              "No. You simply invite our secure platform to manage your listing as a 'Manager'. You retain full ownership and can remove us at any time.",
          },
          {
            question: "What is the 'Magic QR' code?",
            answer:
              "It's a custom-branded QR code we provide for your shop. When scanned by customers, it opens your Google review page with a 5-star rating already selected, making it effortless for them to leave a review.",
          },
          {
            question: "Can I cancel my subscription anytime?",
            answer:
              "Yes, absolutely. There are no long-term contracts or lock-in periods. You can cancel your subscription with just one click from your dashboard.",
          },
          {
            question: "Does this work for all types of local businesses?",
            answer:
              "Yes! Whether you run a restaurant, a clinic, a salon, a retail store, or even a home-based service, Limbu AI is designed to help any business that serves local customers.",
          },
          {
            question: "What happens if I have multiple business locations?",
            answer: `We support multi-location businesses! You can manage all your ${cityName} outlets from a single Limbu AI dashboard and get a consolidated view of your growth.`,
          },
          {
            question: "Is there a setup fee?",
            answer:
              "No. We believe in our results, so we don't charge any hidden setup, onboarding, or technical fees. You only pay the simple monthly price of your chosen plan.",
          },
        ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <UrgencyBanner cityName={cityName} />
      <StickyBar waUrl={WA} />

      <main>
        {/* ── HERO SECTION ── */}
        <section className="relative pt-12 md:pt-20 pb-16 md:pb-32 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-200 rounded-full px-4 py-2 text-yellow-800 text-sm font-bold mb-6 shadow-sm">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />{" "}
                  {cityName} 's #1 GMB Automation Tool
                </div>
                <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                  {pageData?.heroHeading ? (
                    pageData.heroHeading
                  ) : (
                    <>
                      Rank #1 on Google in{" "}
                      <span className="text-lemon-hover">{cityName}</span> -
                      Automatically.
                    </>
                  )}
                </h1>
                <p className="text-lg md:text-2xl text-slate-600 mb-10 leading-relaxed font-medium">
                  {pageData?.heroSubheading ||
                    `We use AI to optimize your Google Business Profile daily, generate 5-star reviews, and dominate your local competition in ${cityName}.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/login"
                    className="inline-flex justify-center items-center gap-2 bg-yellow-400 text-slate-900 px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-[0_4px_20px_rgba(250,204,21,0.4)]"
                  >
                    Get 500 Coins for Free <ArrowRight className="w-5 h-5" />
                  </Link>
                  <WatchDemoButton className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all group">
                    Watch Demo
                    <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </WatchDemoButton>
                </div>
                <div className="mt-8 flex items-center gap-6 text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> No Setup
                    Fee
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> Cancel
                    Anytime
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-slate-800 rounded-[2rem] p-4 border border-slate-700 shadow-2xl">
                  <Image
                    src={DEFAULT_IMAGES.hero}
                    alt="Limbu AI Dashboard"
                    width={800} // adjust based on your image
                    height={500} // adjust based on your image
                    className="rounded-2xl shadow-inner"
                  />

                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 hidden md:block animate-bounce-slow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                          Growth This Month
                        </p>
                        <p className="text-xl font-black text-slate-900">
                          +342%
                        </p>
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
            <div className="text-center mb-10">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                Our Impact in {cityName}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
              <StatCard
                target={pageData?.postsAutomated || 10000}
                suffix="+"
                label="Posts Automated"
              />
              <StatCard
                target={pageData?.reviewsGenerated || 50000}
                suffix="+"
                label="Reviews Generated"
              />
              <StatCard
                target={pageData?.businessesServed || 500}
                suffix="+"
                label="Local Businesses"
              />
              <StatCard
                target={pageData?.avgProfileGrowth || 340}
                suffix="%"
                label="Avg. Growth"
              />
            </div>
          </div>
        </section>

        {/* ── PROBLEM SECTION ── */}
        <ProblemSection cityName={cityName} />

        {/* ── FEATURES SECTION ── */}
        <section
          id="features"
          className="py-8 md:py-12 bg-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-3 py-1 rounded-full">
                Core Features
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-6 mb-4">
                Everything You Need to Rank #1 in {cityName}
              </h2>
              <p className="text-slate-600 text-lg font-medium">
                Why waste time on manual updates when AI can do it 10x better
                and faster for your local audience?
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-yellow-200 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT SECTION ── */}
        <section className="py-8 md:py-10 bg-slate-50 border-y border-slate-200 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[140%] bg-white rounded-full blur-[100px] opacity-70 pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[120%] bg-yellow-200 rounded-full blur-[120px] opacity-20 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4  relative z-10 text-left">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 text-sm font-bold text-yellow-600 uppercase tracking-wider mb-6 border border-yellow-200 bg-yellow-50 px-4 py-1.5 rounded-full shadow-sm">
              <Award className="w-4 h-4" /> About Limbu AI
            </div>

            {/* Heading */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 leading-tight">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-700">
                Limbu AI
              </span>{" "}
              - {cityName}'s Growth Partner
            </h2>

            {/* Content */}
            <div className="space-y-6 text-base md:text-lg text-slate-600 font-medium leading-relaxed w-full">
              <p>
                Managing a local business in{" "}
                <strong className="text-slate-900">{cityName}</strong> is
                already challenging. But staying consistent with your online
                presence — updating your{" "}
                <strong className="text-slate-900">
                  Google Business Profile
                </strong>
                , replying to customer reviews, and improving your{" "}
                <strong className="text-slate-900">
                  local search rankings
                </strong>{" "}
                - can feel overwhelming.
              </p>

              <p>
                <strong className="text-slate-900">
                  Limbu AI was built to eliminate this burden completely for{" "}
                  {cityName} entrepreneurs.
                </strong>{" "}
                It is a smart automation platform designed specifically for{" "}
                <strong className="text-slate-900">
                  local businesses, shop owners, and service providers
                </strong>{" "}
                who want to grow online without hiring expensive marketing
                teams.
              </p>

              <p>
                Our AI works as your{" "}
                <strong className="text-slate-900">
                  24/7 digital marketing manager
                </strong>
                , helping you stay active, visible, and competitive in your
                local market. From generating{" "}
                <strong className="text-slate-900">
                  high-quality daily posts
                </strong>{" "}
                with your branding to boosting your{" "}
                <strong className="text-slate-900">customer engagement</strong>,
                everything runs automatically.
              </p>

              <p>
                With features like{" "}
                <strong className="text-slate-900">AI-generated content</strong>
                , <strong className="text-slate-900">review automation</strong>,
                and <strong className="text-slate-900">Magic QR codes</strong>,
                you can significantly increase your{" "}
                <strong className="text-slate-900">5-star ratings</strong> and
                build stronger trust with your customers.
              </p>

              <p>
                <strong className="text-slate-900">The result?</strong> More
                visibility, more customers, and more growth for your business in{" "}
                <strong className="text-slate-900">{cityName}</strong> - without
                extra effort.
              </p>

              <p>
                Limbu AI handles the complex algorithms behind the scenes, so
                you can focus on what truly matters:
                <strong className="text-slate-900">
                  {" "}
                  running your business and serving your customers better.
                </strong>
              </p>

              {/* Review Style Line */}
              <p className="italic text-slate-700 border-l-4 border-yellow-400 pl-4">
                “Since using{" "}
                <strong className="text-slate-900">Limbu AI</strong>, our
                business visibility in {cityName} increased dramatically. We
                started getting more calls, more reviews, and more walk-in
                customers - all without extra effort.”
              </p>
            </div>
          </div>
        </section>

        {/* ── BEFORE/AFTER ── */}
        <BeforeAfterSection cityName={cityName} />

        {/* ── DEMO ── */}
        <div id="demo">
          <DemoSection dashboardImg={DEFAULT_IMAGES.hero} />
        </div>

        {/* ── ROI/CALCULATOR ── */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-600 text-sm font-bold mb-6 uppercase tracking-widest">
                  Revenue Growth
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                  Calculate Your{" "}
                  <span className="text-yellow-600 underline decoration-yellow-400/30 underline-offset-8">
                    Growth Potential
                  </span>
                </h2>
                <p className="text-slate-600 text-lg mb-10 leading-relaxed font-medium">
                  Local SEO isn't just about 'ranking'. It's about revenue. Use
                  our tool to see how much more you could be making with Limbu
                  AI in {cityName}.
                </p>
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  {[
                    `Average ${cityName} clients gain 2.8x more customers`,
                    "Profile views typically increase by 300–500%",
                    "Most businesses break even within the first week",
                    "Average 3x ROI across our entire client base",
                  ].map((t) => (
                    <div
                      key={t}
                      className="flex items-start gap-4 text-slate-700 font-bold"
                    >
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      {t}
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
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
                Limbu AI vs Alternatives
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Decide for yourself — the numbers and facts speak for themselves
                for businesses in {cityName}.
              </p>
            </div>
            <ComparisonTable cityName={cityName} />
          </div>
        </section>

        {/* ── CASE STUDIES ── */}
        <CaseStudiesSection
          cityName={cityName}
          caseStudies={pageData?.caseStudies}
        />

        {/* ── TESTIMONIALS ── */}
        <section
          id="reviews"
          className="py-14 bg-slate-50 border-t border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider bg-yellow-100 px-3 py-1 rounded-full">
                Client Reviews
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-6">
                Real Words, Real Results
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl border border-slate-200 relative hover:shadow-xl hover:border-yellow-300 transition-all duration-300 group"
                >
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-100 group-hover:text-yellow-100 transition-colors" />
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                    {t.verified && (
                      <span className="ml-2 text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 mb-6 italic leading-relaxed font-medium">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-4 border-t border-slate-100 pt-5">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 border border-yellow-200 shadow-sm">
                      <span className="text-xl font-black text-yellow-700">
                        {t.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">
                        {t.name}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GUARANTEE ── */}
        <GuaranteeSection cityName={cityName} />

        {/* ── FAQ ── */}
        <section id="faq" className="py-14 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Have a question? Ask us on WhatsApp — we usually reply within 5
                minutes.
              </p>
            </div>
            <CityFaqAccordion faqs={faqs} />
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
              Your competitors are already using local SEO. Every day you wait,
              you're losing ready-to-buy customers to them.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <a
                href={WA}
                className="inline-flex justify-center items-center gap-2 bg-yellow-400 text-slate-900 px-10 py-5 rounded-full font-extrabold text-lg hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.4)]"
              >
                Claim Your Free Audit <ArrowRight className="w-6 h-6" />
              </a>
              <a
                href="tel:+919289344726"
                className="inline-flex justify-center items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/20 transition-all"
              >
                <Phone className="w-5 h-5" /> Call Us Now
              </a>
            </div>
            <p className="mt-8 text-sm text-slate-400 flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> No credit card
              required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </section>
      </main>

      <FooterSection />
      <VideoModal />
    </div>
  );
}
