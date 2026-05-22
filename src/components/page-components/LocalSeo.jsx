"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import {
  CheckCircle,
  BarChart3,
  MapPin,
  Star,
  PenTool,
  Search,
  MousePointerClick,
  PhoneCall,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  Navigation,
} from "lucide-react";
import Navbar from "../sections/HeaderSection";
import FooterSection from "../sections/FooterSection";
import VideoModal from "../modals/VideoModal";
import Link from "next/link";
import Image from "next/image";
import { POPULAR_CITIES } from "@/utils/popularCity";

const POPULAR_LOCAL_SEO_CITIES = POPULAR_CITIES;

function createLocalSeoCitySlug(city) {
  return `local-seo-${city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export default function LocalSEOPage({ city, slug }) {
  const setSelectedVideo = useAuthStore((state) => state.setSelectedVideo);
  const cityName = city
    ? city
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "India";

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-yellow-100">
      {/* Smaller Header Font Size Wrapper */}
      <div className="text-sm">
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* SECTION 1: HERO SECTION */}
        <section className="relative  pt-20 pb-8 lg:pt-26 lg:pb-10 border-b border-gray-50">
          <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-5 leading-tight text-slate-900">
                Local SEO Services in {cityName} That Help Your Business{" "}
                <span className="text-yellow-500">Rank Higher on Google</span>
              </h1>
              <p className="text-base text-slate-600 mb-8 max-w-lg leading-relaxed">
                Get more customers in {cityName} with AI-powered local SEO,
                Google Business Profile optimization, review management, and
                location-based ranking strategies.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="https://wa.me/919289344726"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-yellow-400 text-slate-900 rounded-lg font-bold text-base hover:bg-yellow-500 transition-colors shadow-sm"
                >
                  Get Free SEO Audit
                </Link>
                <button
                  className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all group"
                  onClick={() =>
                    setSelectedVideo(
                      "https://youtu.be/eQUd6u36w3g?si=_AJ3OymZQD6HnXRl",
                    )
                  }
                >
                  Watch Demo
                  <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-xl">
                <Image
                  src="/images/local-seo.png"
                  alt="Dashboard and Ranking Graphic"
                  width={800}
                  height={600}
                  className="rounded-xl"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-xl shadow-lg border border-slate-50 flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <BarChart3 className="text-yellow-600 w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    +145% Traffic
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Google Maps
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NEW SECTION: VISUAL STEP-BY-STEP PROCESS */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
                How Local SEO Works in {cityName} &{" "}
                <span className="text-yellow-500">How Limbu AI Solves It</span>
              </h2>
              <p className="text-slate-500 text-lg">
                Mastering the Google Maps algorithm in {cityName} doesn't have
                to be hard. Here is the logic behind local rankings and how we
                automate it for you.
              </p>
            </div>

            <div className="space-y-24">
              {/* STEP 1 */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="relative order-2 lg:order-1">
                  <div className="bg-yellow-400/10 absolute -inset-4 rounded-[2rem] -rotate-2"></div>
                  <Image
                    src="/images/searcher-local-seo.png"
                    alt={`Local Keyword Research in ${cityName}`}
                    width={600}
                    height={400}
                    className="rounded-2xl shadow-2xl relative z-10 border border-slate-100"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-yellow-400 text-slate-900 font-black px-4 py-1 rounded-full text-sm">
                      STEP 01
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      The Power of{" "}
                      <span className="text-yellow-500">Relevance</span>
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                      <p className="font-bold text-slate-700 text-sm mb-1">
                        Local SEO Concept:
                      </p>
                      <p className="text-slate-500 text-sm italic">
                        Google ranks {cityName} businesses based on how well
                        their profile matches searches like{" "}
                        <strong>"Best Pizza in {cityName}"</strong> or{" "}
                        <strong>"Emergency Plumber {cityName}"</strong>.
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                      <p className="font-bold text-yellow-700 text-sm mb-1">
                        Limbu AI Solution:
                      </p>
                      <p className="text-slate-700 text-sm font-medium">
                        Our AI scans {cityName} local search trends every 24
                        hours and automatically updates your business categories
                        and keywords to match what {cityName} customers are
                        searching for right now.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-yellow-400 text-slate-900 font-black px-4 py-1 rounded-full text-sm">
                      STEP 02
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Signal of{" "}
                      <span className="text-yellow-500">Freshness</span>
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                      <p className="font-bold text-slate-700 text-sm mb-1">
                        Local SEO Concept:
                      </p>
                      <p className="text-slate-500 text-sm italic">
                        {cityName} profiles that post regular updates, photos,
                        and offers are seen as "Active" and are pushed to the
                        top of Google Maps results in {cityName}.
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                      <p className="font-bold text-yellow-700 text-sm mb-1">
                        Limbu AI Solution:
                      </p>
                      <p className="text-slate-700 text-sm font-medium">
                        You don't need to write a single word. Limbu AI creates
                        high-quality, SEO-optimized Google Posts tailored for{" "}
                        {cityName} daily, keeping your profile 100% active on
                        autopilot.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative order-2">
                  <div className="bg-yellow-400/10 absolute -inset-4 rounded-[2rem] rotate-2"></div>
                  <Image
                    src="/images/authority-local-seo.png"
                    alt={`AI Automated Posting for ${cityName}`}
                    width={600}
                    height={400}
                    className="rounded-2xl shadow-2xl relative z-10 border border-slate-100"
                  />
                </div>
              </div>

              {/* STEP 3 */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="relative order-2 lg:order-1">
                  <div className="bg-yellow-400/10 absolute -inset-4 rounded-[2rem] -rotate-2"></div>
                  <Image
                    src="/images/freshness-local-seo.png"
                    alt={`Review Management in ${cityName}`}
                    width={600}
                    height={400}
                    className="rounded-2xl shadow-2xl relative z-10 border border-slate-100"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-yellow-400 text-slate-900 font-black px-4 py-1 rounded-full text-sm">
                      STEP 03
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Building{" "}
                      <span className="text-yellow-500">Trust & Authority</span>{" "}
                      in {cityName}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                      <p className="font-bold text-slate-700 text-sm mb-1">
                        Local SEO Concept:
                      </p>
                      <p className="text-slate-500 text-sm italic">
                        Google prioritizes {cityName} businesses that respond to
                        reviews quickly. It proves you are a reliable, trusted
                        business with high customer engagement in {cityName}.
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                      <p className="font-bold text-yellow-700 text-sm mb-1">
                        Limbu AI Solution:
                      </p>
                      <p className="text-slate-700 text-sm font-medium">
                        Our AI monitors your {cityName} reviews 24/7. When a
                        customer leaves feedback, Limbu AI generates a
                        professional, custom reply instantly — ensuring your
                        engagement score stays at the top of {cityName} search
                        results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT'S INCLUDED */}
        <section className="py-10 bg-white border-b border-gray-50">
          <div className="container mx-auto px-6 text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900">
              What's Included in Our{" "}
              <span className="text-yellow-500">
                {cityName} Local SEO Service
              </span>
            </h2>
            <p className="text-slate-500 text-sm">
              Everything your {cityName} business needs to dominate local search
              results.
            </p>
          </div>
          <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "GBP Optimization",
                desc: `Optimize your ${cityName} business categories, keywords, services, photos, and info for maximum visibility.`,
                icon: <MapPin size={20} className="text-yellow-600" />,
              },
              {
                title: "Local Keyword Ranking",
                desc: `Rank for 'dentist near me' or 'best gym in ${cityName}' automatically with AI-driven keyword targeting.`,
                icon: <Search size={20} className="text-yellow-600" />,
              },
              {
                title: "Reputation Management",
                desc: `Increase positive reviews from ${cityName} customers and respond faster with AI automation.`,
                icon: <Star size={20} className="text-yellow-600" />,
              },
              {
                title: "AI Content & Posts",
                desc: `Automatically publish ${cityName}-focused, SEO-friendly Google posts and updates daily.`,
                icon: <PenTool size={20} className="text-yellow-600" />,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-yellow-200 transition-all group"
              >
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-100 transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: HOW IT WORKS */}
        <section className="py-16 bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
                3 Simple Steps to{" "}
                <span className="text-yellow-500">
                  Dominate {cityName} Market
                </span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Here is how we sync Limbu AI with your {cityName} business
                profile to start pushing you to the top of Google Maps.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Connect Your Profile",
                  desc: `Securely link your ${cityName} Google Business Profile with Limbu AI dashboard in just 1-click.`,
                },
                {
                  step: "02",
                  title: "AI Scan & Optimization",
                  desc: `Our AI analyzes ${cityName} local competitors, fixes citation gaps, and injects high-ranking keywords for your area.`,
                },
                {
                  step: "03",
                  title: "Autopilot Growth",
                  desc: `Limbu AI starts publishing daily ${cityName}-focused posts and tracking your local ranking metrics 24/7.`,
                },
              ].map((proc, i) => (
                <div
                  key={i}
                  className="relative p-6 rounded-xl border border-slate-100 shadow-sm bg-white"
                >
                  <div className="text-4xl font-black text-yellow-400/40 mb-3 font-mono">
                    {proc.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-slate-900">
                    {proc.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {proc.desc}
                  </p>
                  {i < 2 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 text-slate-300">
                      <ArrowRight size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: COMPARISON MATRIX TABLE */}
        <section className="py-10 bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
                Why {cityName} Businesses Choose Limbu AI Over{" "}
                <span className="text-yellow-500">Traditional Agencies</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                See how our automation stack saves {cityName} businesses time
                and keeps their profile updated 24/7.
              </p>
            </div>
            <div className="max-w-3xl mx-auto overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-900 uppercase tracking-wider bg-yellow-50/50">
                      Limbu AI
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 tracking-wider">
                      Traditional Agencies
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 tracking-wider">
                      Manual Management
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {[
                    {
                      f: "Review Response Time",
                      l: "Within seconds (AI)",
                      a: "24-48 Hours",
                      m: "Days or Forgotten",
                    },
                    {
                      f: `${cityName} Post Frequency`,
                      l: "Daily/Automated",
                      a: "Weekly or Less",
                      m: "Rarely updated",
                    },
                    {
                      f: `${cityName} Keyword Optimization`,
                      l: "Real-time AI scanning",
                      a: "Monthly reports",
                      m: "No tracking",
                    },
                    {
                      f: "Multi-Location Control",
                      l: "Central Dashboard",
                      a: "Extra retainer costs",
                      m: "Extremely difficult",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-medium text-slate-800">
                        {row.f}
                      </td>
                      <td className="p-4 font-bold text-yellow-600 bg-yellow-50/20 flex items-center gap-2">
                        <CheckCircle
                          size={16}
                          className="text-yellow-500 flex-shrink-0"
                        />{" "}
                        {row.l}
                      </td>
                      <td className="p-4 text-slate-500">{row.a}</td>
                      <td className="p-4 text-slate-400">{row.m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 5: EXPLAINER SECTION */}
        <section className="py-10 bg-white border-b border-gray-50">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="p-8 md:p-12 border-2 border-yellow-400 rounded-[2rem] text-center bg-white shadow-sm">
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold mb-5 uppercase tracking-widest">
                <Lightbulb size={14} />
                <span>Understanding Local SEO in {cityName}</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                How Local SEO Works in {cityName} &{" "}
                <span className="text-yellow-500">
                  Limbu AI Makes You Unstoppable
                </span>
              </h2>
              <div className="space-y-5 text-base text-slate-600 leading-relaxed">
                <p>
                  Local SEO is the secret sauce that makes your {cityName}{" "}
                  business show up when someone nearby searches for what you
                  offer. When a customer types{" "}
                  <span className="font-bold text-slate-900 border-b-2 border-yellow-200">
                    "best plumber near me in {cityName}"
                  </span>{" "}
                  or{" "}
                  <span className="font-bold text-slate-900 border-b-2 border-yellow-200">
                    "cafe in {cityName},"
                  </span>{" "}
                  Google scans thousands of data points to decide who ranks in
                  the top 3 spots.
                </p>
                <p>
                  This is where <strong>Limbu AI</strong> takes over. Most{" "}
                  {cityName} businesses fail because they don't update their
                  profile daily. Limbu AI automates this by constantly feeding
                  Google's algorithm with fresh AI-generated posts, responding
                  to {cityName} customer reviews in seconds, and fixing your
                  business data across the web.
                </p>
                <p className="text-xl font-bold mt-4 text-yellow-600">
                  We don't just manage your {cityName} profile; we teach Google
                  that your business is the most active, trusted, and relevant
                  choice in {cityName}.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: WHY CHOOSE */}
        <section className="py-10 bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900">
                  Why {cityName} Businesses Choose Limbu AI for{" "}
                  <span className="text-yellow-500">Local SEO</span>
                </h2>
                <ul className="space-y-3">
                  {[
                    `AI-powered automation for 24/7 ${cityName} profile optimization`,
                    "Multi-location support for scaling brands",
                    `Faster Google Maps growth for ${cityName} businesses`,
                    `Automated posting & review replies in ${cityName}`,
                    "Easy-to-use analytics dashboard",
                  ].map((point, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="text-yellow-500 w-5 h-5" />
                      <span className="text-slate-600 text-sm font-medium">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Businesses Managed", val: "500+" },
                  { label: "AI Posts Published", val: "10K+" },
                  { label: "Search Impressions", val: "2M+" },
                  { label: "Rating", val: "4.9/5" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-xl border border-slate-100 text-center hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl font-black mb-1 text-yellow-600">
                      {stat.val}
                    </div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: BENEFITS */}
        <section className="py-10 bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
                Key Benefits of{" "}
                <span className="text-yellow-500">Local SEO in {cityName}</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Our <strong>local SEO company</strong> helps your {cityName}{" "}
                business appear in <strong>Google Maps ranking</strong> and
                local search results when nearby {cityName} customers search for
                your services.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <MousePointerClick size={24} />,
                  title: `More ${cityName} Leads`,
                  desc: `Connect with ${cityName} customers who are ready to buy right now.`,
                },
                {
                  icon: <MapPin size={24} />,
                  title: "Higher Visibility",
                  desc: `Dominate the '${cityName} Local 3-Pack' results on Google Maps.`,
                },
                {
                  icon: <PhoneCall size={24} />,
                  title: "Increased Calls",
                  desc: `Convert ${cityName} digital views into real physical visits and calls.`,
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-6 rounded-xl bg-white border-2 border-slate-200"
                >
                  <div className="text-yellow-500 mb-4">{benefit.icon}</div>
                  <h4 className="font-bold mb-2 text-slate-900 text-base">
                    {benefit.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section className="py-10 bg-white border-b border-gray-50">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold mb-3 uppercase tracking-widest">
                <span>FAQ</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4">
                {cityName} Local SEO &{" "}
                <span className="text-yellow-500">Google Maps FAQ</span>
              </h2>
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                Everything {cityName} businesses need to know about optimizing
                their Google Business Profile and ranking higher in local
                search.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-start">
              {[
                {
                  q: `What is Google 3-Pack and why does it matter for ${cityName} businesses?`,
                  a: `The Google 3-Pack displays the top three local business results for searches in ${cityName}. Getting featured here drives over 60% of all organic local clicks in ${cityName}, bypassing traditional organic text results.`,
                },
                {
                  q: `How long does it take to see ranking improvements in ${cityName}?`,
                  a: `While SEO depends heavily on competition in ${cityName}, businesses optimized via Limbu AI generally experience initial keyword index variations and proximity improvements within 14 to 30 days.`,
                },
                {
                  q: "Is it safe to automate my Google Profile posts using AI?",
                  a: `Yes, 100%. Limbu AI strictly complies with Google Business Profile policies. Our models generate natural, localized updates specific to ${cityName}, using relevant service keywords and event patterns to safely satisfy the algorithm.`,
                },
                {
                  q: `Can I monitor multiple ${cityName} locations from one place?`,
                  a: `Absolutely. Our platform scales gracefully with your ${cityName} business footprint. You can aggregate data pipelines, update business details, and optimize tracking metrics for multiple ${cityName} locations from a single dashboard.`,
                },
                {
                  q: `How does automated review management help my ${cityName} business?`,
                  a: `Google directly prioritizes ${cityName} profiles with high engagement rates and rapid response times. Limbu AI instantly analyzes customer feedback, drafts professional context-aware answers, and boosts your local authority in ${cityName}.`,
                },
                {
                  q: `What local ranking signals do you optimize for in ${cityName}?`,
                  a: `We systematically target the primary pillars of Google's local algorithm for ${cityName}: Proximity (closeness to the searcher in ${cityName}), Relevance (keyword saturation and business categorization), and Prominence (review health, activity flow, and uniform citations).`,
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-yellow-200 transition-all duration-300 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-4 cursor-pointer group">
                    <h4 className="font-bold text-base text-slate-900 group-hover:text-slate-700 transition-colors">
                      {faq.q}
                    </h4>
                    <ChevronDown
                      size={18}
                      className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0 mt-1"
                    />
                  </div>
                  <p className="mt-4 text-xs md:text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-4">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white text-slate-900">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-[0.6fr_1.4fr] gap-12 items-start">
              {/* LEFT SIDE: STICKY HEADER */}
              <div className="lg:sticky lg:top-32">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-700 mb-5">
                  <Navigation size={12} className="text-yellow-600" />
                  Service Areas
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-5 text-slate-900">
                  Local SEO by{" "}
                  <span className="relative inline-block">
                    City Focus
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-300/40 -z-10" />
                  </span>
                </h2>
                <p className="text-base text-slate-500 leading-relaxed max-w-sm">
                  Select a city to view customized ranking strategies and
                  localized keyword data.
                </p>
              </div>

              {/* RIGHT SIDE: SMALL CITY GRID */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {POPULAR_LOCAL_SEO_CITIES.map((localCity) => {
                  const citySlug = createLocalSeoCitySlug(localCity);
                  const isActiveCity =
                    cityName.toLowerCase() === localCity.toLowerCase();

                  return (
                    <Link
                      key={localCity}
                      href={`/services/${citySlug}`}
                      aria-current={isActiveCity ? "page" : undefined}
                      className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                        isActiveCity
                          ? "border-yellow-400 bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-100 scale-[1.02]"
                          : "border-slate-100 bg-slate-50/50 hover:border-yellow-400 hover:bg-white hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActiveCity
                              ? "bg-slate-950/10"
                              : "bg-white border border-slate-100 group-hover:bg-yellow-50"
                          }`}
                        >
                          <MapPin
                            size={14}
                            className={
                              isActiveCity
                                ? "text-slate-900"
                                : "text-yellow-500"
                            }
                          />
                        </div>
                        <h3 className="text-sm font-bold tracking-tight">
                          {localCity}
                        </h3>
                      </div>

                      <ArrowRight
                        size={14}
                        className={`transition-all duration-300 ${
                          isActiveCity
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-yellow-600"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: FINAL CTA */}
        <section className="py-10 bg-white">
          <div className="container mx-auto px-6">
            <div className="bg-white border-4 border-yellow-400 rounded-[2.5rem] p-10 md:p-16 text-center text-slate-900 shadow-xl">
              <h2 className="text-2xl md:text-4xl font-black mb-4">
                Ready to Grow Your{" "}
                <span className="text-yellow-500">{cityName} Business?</span>
              </h2>
              <p className="text-base text-slate-600 mb-8 max-w-xl mx-auto">
                Let Limbu AI automate your local SEO and help your {cityName}{" "}
                business rank higher on Google Maps. No long-term contracts.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button className="px-8 py-3 bg-yellow-400 text-slate-900 rounded-lg font-bold text-base hover:bg-yellow-500 transition shadow-md">
                  Start Free Trial
                </button>
                <button className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold text-base hover:bg-slate-800 transition shadow-md">
                  Book Free {cityName} Consultation
                </button>
              </div>
              <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ⭐ Rated 4.9/5 by {cityName} small business owners
              </p>
            </div>
          </div>
        </section>
      </div>

      <FooterSection />

      <VideoModal />
    </div>
  );
}
