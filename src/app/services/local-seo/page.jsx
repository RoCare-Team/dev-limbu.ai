"use client";

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
} from "lucide-react";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import VideoModal from "@/components/modals/VideoModal";

export default function LocalSEOPage() {
  const setSelectedVideo = useAuthStore((state) => state.setSelectedVideo);

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
                Local SEO Services That Help Your Business{" "}
                <span className="text-yellow-500">Rank Higher on Google</span>
              </h1>
              <p className="text-base text-slate-600 mb-8 max-w-lg leading-relaxed">
                Get more local customers with AI-powered local SEO, Google
                Business Profile optimization, review management, and
                location-based ranking strategies.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={"/login"}
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
        <section className="py-20  bg-white">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
                How Local SEO Works &{" "}
                <span className="text-yellow-500">How Limbu AI Solves It</span>
              </h2>
              <p className="text-slate-500 text-lg">
                Mastering the Google Maps algorithm doesn't have to be hard.
                Here is the logic behind local rankings and how we automate it
                for you.
              </p>
            </div>

            <div className="space-y-24">
              {/* STEP 1 */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="relative order-2 lg:order-1">
                  <div className="bg-yellow-400/10 absolute -inset-4 rounded-[2rem] -rotate-2"></div>
                  <Image
                    src="/images/searcher-local-seo.png" // Replace with your image
                    alt="Local Keyword Research"
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
                        Google ranks you based on how well your profile matches
                        the user's search like "Best Pizza" or "Emergency
                        Plumber".
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                      <p className="font-bold text-yellow-700 text-sm mb-1">
                        Limbu AI Solution:
                      </p>
                      <p className="text-slate-700 text-sm font-medium">
                        Our AI scans local search trends every 24 hours and
                        automatically updates your business categories and
                        keywords to match what people are searching for right
                        now.
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
                        Profiles that post regular updates, photos, and offers
                        are seen as "Active" and are pushed to the top of Google
                        Maps.
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                      <p className="font-bold text-yellow-700 text-sm mb-1">
                        Limbu AI Solution:
                      </p>
                      <p className="text-slate-700 text-sm font-medium">
                        You don't need to write a single word. Limbu AI creates
                        high-quality, SEO-optimized Google Posts and captions
                        daily, keeping your profile 100% active on autopilot.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative order-2">
                  <div className="bg-yellow-400/10 absolute -inset-4 rounded-[2rem] rotate-2"></div>
                  <Image
                    src="/images/authority-local-seo.png" // Replace with your image
                    alt="AI Automated Posting"
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
                    src="/images/freshness-local-seo.png" // Replace with your image
                    alt="Review Management"
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
                      <span className="text-yellow-500">Trust & Authority</span>
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                      <p className="font-bold text-slate-700 text-sm mb-1">
                        Local SEO Concept:
                      </p>
                      <p className="text-slate-500 text-sm italic">
                        Google prioritizes businesses that respond to reviews
                        quickly. It proves you are a reliable business with high
                        customer engagement.
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                      <p className="font-bold text-yellow-700 text-sm mb-1">
                        Limbu AI Solution:
                      </p>
                      <p className="text-slate-700 text-sm font-medium">
                        Our AI monitors reviews 24/7. When a customer leaves
                        feedback, Limbu AI generates a professional, custom
                        reply instantly, ensuring your engagement score stays at
                        the top.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT'S INCLUDED */}
        <section className="py-10 bg-white  border-b border-gray-50">
          <div className="container mx-auto px-6 text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900">
              What’s Included in Our{" "}
              <span className="text-yellow-500">Local SEO Service</span>
            </h2>
            <p className="text-slate-500 text-sm">
              Everything you need to dominate local search results.
            </p>
          </div>
          <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "GBP Optimization",
                desc: "Optimize categories, keywords, services, photos, and business info.",
                icon: <MapPin size={20} className="text-yellow-600" />,
              },
              {
                title: "Local Keyword Ranking",
                desc: "Rank for 'dentist near me' or 'best gym in Delhi' automatically.",
                icon: <Search size={20} className="text-yellow-600" />,
              },
              {
                title: "Reputation Management",
                desc: "Increase positive reviews and respond faster with AI automation.",
                icon: <Star size={20} className="text-yellow-600" />,
              },
              {
                title: "AI Content & Posts",
                desc: "Automatically publish SEO-friendly Google posts and updates.",
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
        <section className="py-16  bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
                3 Simple Steps to{" "}
                <span className="text-yellow-500">Dominate Your Market</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Here is how we sync Limbu AI with your business profile to start
                pushing you to the top of Google Maps.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Connect Your Profile",
                  desc: "Securely link your Google Business Profile with Limbu AI dashboard in just 1-click.",
                },
                {
                  step: "02",
                  title: "AI Scan & Optimization",
                  desc: "Our AI analyzes local competitors, fixes citation gaps, and injects high-ranking keywords.",
                },
                {
                  step: "03",
                  title: "Autopilot Growth",
                  desc: "Limbu AI starts publishing daily localized posts and tracking ranking metrics 24/7.",
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
        <section className="py-10  bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
                Why Limbu AI Wins Over{" "}
                <span className="text-yellow-500">Traditional Agencies</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                See how our automation stack saves you time and keeps your
                profile updated 24/7.
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
                      f: "Google Post Frequency",
                      l: "Daily/Automated",
                      a: "Weekly or Less",
                      m: "Rarely updated",
                    },
                    {
                      f: "Keyword Optimization",
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
        <section className="py-10  bg-white border-b border-gray-50">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="p-8 md:p-12 border-2 border-yellow-400 rounded-[2rem] text-center bg-white shadow-sm">
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold mb-5 uppercase tracking-widest">
                <Lightbulb size={14} />
                <span>Understanding Local SEO</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                How Local SEO Works &{" "}
                <span className="text-yellow-500">
                  Limbu AI Makes You Unstoppable
                </span>
              </h2>
              <div className="space-y-5 text-base text-slate-600 leading-relaxed">
                <p>
                  Local SEO is the secret sauce that makes your business show up
                  when someone nearby searches for what you offer. When a
                  customer types{" "}
                  <span className="font-bold text-slate-900 border-b-2 border-yellow-200">
                    "best plumber near me"
                  </span>{" "}
                  or{" "}
                  <span className="font-bold text-slate-900 border-b-2 border-yellow-200">
                    "cafe in South Delhi,"
                  </span>{" "}
                  Google scans thousands of data points to decide who ranks in
                  the top 3 spots.
                </p>
                <p>
                  This is where <strong>Limbu AI</strong> takes over. Most
                  businesses fail because they don't update their profile daily.
                  Limbu AI automates this by constantly feeding Google’s
                  algorithm with fresh AI-generated posts, responding to
                  customer reviews in seconds, and fixing your business data
                  across the web.
                </p>
                <p className="text-xl font-bold mt-4 text-yellow-600">
                  We don't just manage your profile; we teach Google that your
                  business is the most active, trusted, and relevant choice in
                  your neighborhood.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: WHY CHOOSE */}
        <section className="py-10  bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900">
                  Why Choose Limbu AI for{" "}
                  <span className="text-yellow-500">Local SEO</span>
                </h2>
                <ul className="space-y-3">
                  {[
                    "AI-powered automation for 24/7 optimization",
                    "Multi-location support for scaling brands",
                    "Faster Google Maps growth with data-driven strategy",
                    "Automated posting & review replies",
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
        <section className="py-10  bg-white border-b border-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
                Key Benefits of{" "}
                <span className="text-yellow-500">Local SEO</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Our <strong>local SEO company</strong> helps your business
                appear in <strong>Google Maps ranking</strong> and local search
                results when nearby customers search for your services.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <MousePointerClick size={24} />,
                  title: "More local leads",
                  desc: "Connect with people ready to buy.",
                },
                {
                  icon: <MapPin size={24} />,
                  title: "Higher Visibility",
                  desc: "Dominate the 'Local 3-Pack' results.",
                },
                {
                  icon: <PhoneCall size={24} />,
                  title: "Increased Calls",
                  desc: "Convert digital views into physical visits.",
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
        <section className="py-10  bg-white border-b border-gray-50">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold mb-3 uppercase tracking-widest">
                <span>FAQ</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4">
                Local SEO &{" "}
                <span className="text-yellow-500">Google Maps FAQ</span>
              </h2>
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                Everything you need to know about optimizing your Google
                Business Profile and ranking higher in local search.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-start">
              {[
                {
                  q: "What is Google 3-Pack and why does it matter?",
                  a: "The Google 3-Pack is the method Google uses to display the top three local business results for a regional search. Getting featured here driving over 60% of all organic local clicks, bypassing traditional organic text results.",
                },
                {
                  q: "How long does it take to see local ranking improvements?",
                  a: "While SEO depends heavily on regional competition, tracking clusters optimized via Limbu AI generally experience initial keyword index variations and proximity improvements within 14 to 30 days.",
                },
                {
                  q: "Is it safe to automate my Google Profile posts using AI?",
                  a: "Yes, 100%. Limbu AI strictly complies with Google Business Profile policies. Our models generate natural, localized operational updates, specific service keywords, and event patterns to safely satisfy the algorithm.",
                },
                {
                  q: "Can I monitor and track multiple physical locations?",
                  a: "Absolutely. Our platform scales gracefully with your business footprint. You can aggregate data pipelines, update business details, and optimize tracking metrics for multiple locations from a single dashboard interface.",
                },
                {
                  q: "How does automated review management help my business?",
                  a: "Google directly prioritizes profiles with high engagement rates and rapid response times. Limbu AI instantly analyzes client feedback sentiment, drafts professional context-aware answers, and boosts proximity authority.",
                },
                {
                  q: "What local ranking signals do you optimize for?",
                  a: "We systematically target the primary core pillars of Google local algorithm: Proximity (closeness to searcher), Relevance (keyword saturation and business categorization), and Prominence (review health, activity flow, and uniform citations).",
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

        {/* SECTION 9: FINAL CTA */}
        <section className="py-10  bg-white">
          <div className="container mx-auto px-6">
            <div className="bg-white border-4 border-yellow-400 rounded-[2.5rem] p-10 md:p-16 text-center text-slate-900 shadow-xl">
              <h2 className="text-2xl md:text-4xl font-black mb-4">
                Ready to Grow Your{" "}
                <span className="text-yellow-500">Local Business?</span>
              </h2>
              <p className="text-base text-slate-600 mb-8 max-w-xl mx-auto">
                Let Limbu AI automate your local SEO and help your business rank
                higher on Google. No long-term contracts.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button className="px-8 py-3 bg-yellow-400 text-slate-900 rounded-lg font-bold text-base hover:bg-yellow-500 transition shadow-md">
                  Start Free Trial
                </button>
                <button className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold text-base hover:bg-slate-800 transition shadow-md">
                  Book Free Consultation
                </button>
              </div>
              <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ⭐ Rated 4.9/5 by small business owners
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
