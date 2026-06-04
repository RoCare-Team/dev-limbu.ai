import Link from "next/link";
import Navbar from "../sections/HeaderSection";
import FooterSection from "../sections/FooterSection";
import { POPULAR_CITIES } from "@/utils/popularCity";
import { ArrowRight, CheckCircle2, ShieldCheck, Star } from "lucide-react";

const GBP_PREFIX = "google-bussiness-profile-management-";

function createCitySlug(city) {
  return `${GBP_PREFIX}${city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export default function GbpNationalServicePage() {
  const featuredCities = POPULAR_CITIES.slice(0, 24);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main>
        <section className="relative pt-20 pb-12 lg:pt-24 lg:pb-16 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-slate-900 text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4 text-yellow-600" />
              Google Business Profile Management
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
              Google Business Profile Management Services in India
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl leading-relaxed mb-8">
              Rank higher on Google Maps with AI-powered Google Business Profile
              management, automated posts, review replies, local SEO optimization,
              and ongoing profile monitoring from Limbu.ai.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/login"
                className="inline-flex justify-center items-center gap-2 bg-yellow-400 text-slate-900 px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-yellow-500 transition-colors"
              >
                Get 500 Coins for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="https://wa.me/917065178662"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
              >
                Free Profile Audit on WhatsApp
              </Link>
            </div>

            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-700 font-medium">
              {[
                "Daily AI-generated Google posts",
                "Magic QR for 5-star Google reviews",
                "Instant AI review replies",
                "Local keyword and category optimization",
                "Google Maps ranking improvements",
                "Multi-location business support",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              City-wise Google Business Profile Management
            </h2>
            <p className="text-slate-600 text-lg mb-8 max-w-3xl">
              Choose your city for localized Google Maps SEO, GMB automation,
              and review growth strategies tailored to your market.
            </p>
            <div className="flex flex-wrap gap-3">
              {featuredCities.map((city) => (
                <Link
                  key={city}
                  href={`/services/${createCitySlug(city)}`}
                  className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-yellow-400 hover:text-slate-900 transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-1 text-yellow-500 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4">
              Why businesses choose Limbu.ai for GMB management
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Limbu.ai helps local businesses stay active on Google Business
              Profile, collect more reviews, respond faster, and improve Google
              Maps visibility without hiring a full marketing team.
            </p>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
