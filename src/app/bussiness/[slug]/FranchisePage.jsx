import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";
import {
  ArrowRight,
  CheckCircle,
  Star,
  PhoneCall,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Shield,
  Zap,
  BarChart,
  Target,
  Rocket,
  Clock,
  Mail as MailIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { mostCities } from "@/utils/popularCity";
import FranchiseApplyTrigger from "./FranchiseApplyTrigger";
import OurStoreSection from "@/components/sections/OurStoreSection";

// ✅ Helper: extract and format city name from URL param
// e.g. "franchise-opportunities-new-delhi" → "New Delhi"
function parseCityName(rawParam) {
  if (!rawParam) return "";

  const prefix = "franchise-opportunities-";

  // If slug is exactly "franchise-opportunities"
  // then no city exists
  if (rawParam === "franchise-opportunities") {
    return "";
  }

  const slug = rawParam.startsWith(prefix)
    ? rawParam.slice(prefix.length)
    : rawParam;

  // Extra safety check
  if (!slug.trim()) {
    return "";
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function createFranchiseCitySlug(city) {
  return `franchise-opportunities-${city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

const partners = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  label: `Partner ${i + 1}`,
}));

const features = [
  { icon: "⚡", title: "Flexible & Scalable", sub: "Start small, grow big" },
  { icon: "∞", title: "Unlimited Users", sub: "No per-seat charges" },
  { icon: "🤝", title: "Up to 10 Partners", sub: "Grow your network" },
  { icon: "🏪", title: "Full Franchise Rights", sub: "Own your territory" },
];

// All coordinates in a 500x500 viewBox — fully scalable
const VB = 500;
const CX = 250,
  CY = 250;
const ORBIT_R = 185;
const INNER_R = 105;
const SLOT_R = 34;

function OrbitDiagram() {
  const slots = partners.map((p, i) => {
    const angle = (2 * Math.PI * i) / partners.length - Math.PI / 2;
    return {
      ...p,
      x: CX + ORBIT_R * Math.cos(angle),
      y: CY + ORBIT_R * Math.sin(angle),
      lx1: CX + (ORBIT_R - SLOT_R - 4) * Math.cos(angle),
      ly1: CY + (ORBIT_R - SLOT_R - 4) * Math.sin(angle),
      lx2: CX + (INNER_R + 4) * Math.cos(angle),
      ly2: CY + (INNER_R + 4) * Math.sin(angle),
    };
  });

  return (
    <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Dashed connector lines */}
        {slots.map((s) => (
          <line
            key={`line-${s.id}`}
            x1={s.lx1}
            y1={s.ly1}
            x2={s.lx2}
            y2={s.ly2}
            stroke="#FCD34D"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
        ))}

        {/* Center glow ring */}
        <circle cx={CX} cy={CY} r={INNER_R + 14} fill="#FEF9EC" />

        {/* Center circle border */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R}
          fill="#FFFBEB"
          stroke="#FBBF24"
          strokeWidth="4"
        />

        {/* Center text */}
        <text
          x={CX}
          y={CY - 30}
          textAnchor="middle"
          fontSize="11"
          fill="#92400E"
          fontFamily="sans-serif"
          letterSpacing="1.5"
        >
          FRANCHISE LICENCE
        </text>
        <text
          x={CX}
          y={CY + 2}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#111827"
          fontFamily="sans-serif"
        >
          ₹5,00,000
        </text>
        <text
          x={CX}
          y={CY + 24}
          textAnchor="middle"
          fontSize="11"
          fill="#B45309"
          fontFamily="sans-serif"
        >
          Add up to 10 partners
        </text>
        <text
          x={CX}
          y={CY + 40}
          textAnchor="middle"
          fontSize="11"
          fill="#B45309"
          fontFamily="sans-serif"
        >
          &amp; unlimited users
        </text>

        {/* Partner slots */}
        {slots.map((s) => (
          <g key={`slot-${s.id}`}>
            <circle
              cx={s.x}
              cy={s.y}
              r={SLOT_R}
              fill="#FEF3C7"
              stroke="#FDE68A"
              strokeWidth="2"
            />
            <circle
              cx={s.x}
              cy={s.y - 7}
              r="5.5"
              fill="none"
              stroke="#D97706"
              strokeWidth="1.6"
            />
            <path
              d={`M${s.x - 8} ${s.y + 10} q8-9 16 0`}
              fill="none"
              stroke="#D97706"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <text
              x={s.x}
              y={s.y + 28}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="#78350F"
              fontFamily="sans-serif"
            >
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// `slug` yahan already-resolved string aata hai. Pehle poora `params` Promise
// pass hota tha aur `params?.slug` Next 16 me `undefined` deta hai — isliye har
// city page ka `cityName` khaali reh jata tha aur "Lucknow" jaisa naam body me
// kahin render hi nahi hota tha.
export default function FranchisePage({ slug = "", cityName: cityNameProp }) {
  const cityName = cityNameProp ?? parseCityName(slug);

  return (
    <div
      className="relative w-full overflow-hidden m-0 p-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Navbar />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <FranchiseApplyTrigger cityName={cityName} />

      {/* =================== HERO SECTION =================== */}
      <section className="relative w-full overflow-hidden py-14 sm:py-24 px-6">
        {/* Background Glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] z-0 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at top right, var(--lemon-glow) 0%, transparent 65%)",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* ================= LEFT CONTENT ================= */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-lemon-glow/20 bg-lemon-glow/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />

                <span className="text-[10px] font-black tracking-widest uppercase text-lemon-ink">
                  {cityName
                    ? `${cityName} Franchise Portal Active`
                    : "Franchise Portal Active"}
                </span>
              </div>

              {/* Heading */}
              <h1
                className="uppercase leading-[1.1] tracking-tight text-black font-black"
                style={{
                  fontSize: "clamp(1.7rem, 3.8vw, 3.1rem)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Build Your Own <br />
                <span className={cityName ? "text-black" : "text-lemon-ink"}>
                  AI Business Empire{" "}
                  {cityName && (
                    <>
                      In <span className="text-lemon-ink">{cityName}</span>
                    </>
                  )}
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-4 text-sm md:text-lg text-slate-500 max-w-xl leading-relaxed font-bold uppercase tracking-widest opacity-90">
                {cityName
                  ? `India's #1 AI-Powered Google My Business Infrastructure in ${cityName}.`
                  : "India's #1 AI-Powered Google My Business Infrastructure."}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                {[
                  { val: "₹2.5L+", label: "Monthly Target" },
                  { val: "100%", label: "Recurring Model" },
                  { val: "Zero", label: "Technical Overhead" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div
                      className="text-2xl font-black text-black tracking-tighter mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {stat.val}
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-10">
                <button
                  type="button" data-franchise-action="open" data-plan="premium"
                  className="btn-lemon px-10 py-4.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
                >
                  {cityName ? `Apply Now For ${cityName}` : "Apply Now"}

                  <ArrowRight size={16} className="ml-2 inline" />
                </button>
              </div>
            </div>

            {/* ================= RIGHT IMAGE ================= */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Glow */}
              <div className="absolute inset-0 bg-lemon-glow/20 blur-3xl rounded-full scale-90" />

              {/* Image Card */}
              <div className="relative rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl bg-white p-3 max-w-[600px]">
                {/* `sizes` ke bina Next sirf 1x/2x srcset banata hai, yaani
                    2x mobile screen bhi 1400px wala variant download karti thi.
                    Ye LCP element hai — isliye asli layout width batana zaroori. */}
                <Image
                  src="/images/frenchiese-image.png"
                  alt="AI Business Franchise"
                  width={700}
                  height={700}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 600px"
                  className="w-full h-full object-cover rounded-[24px]"
                  priority
                />

                {/* Floating Card */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl px-5 py-4">
                  <div className="text-2xl font-black text-black leading-none">
                    250+
                  </div>

                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mt-1">
                    Businesses Scaled
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== TRUST SIGNALS =================== */}
      <section className="py-8 sm:py-10 border-y border-slate-200 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Optional Heading */}
          <div className="text-center mb-8">
            <h2
              className="uppercase font-black tracking-tight text-black"
              style={{
                fontSize: "clamp(1.1rem, 2vw, 1.7rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Trusted Across{" "}
              {cityName ? (
                <span className="text-lemon-ink">{cityName}</span>
              ) : (
                "India"
              )}
            </h2>

            <p className="mt-2 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">
              Fast Growing AI Business Franchise Network
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: "1000+", label: "Happy Partners" },
              { value: "50+", label: "Cities Covered" },
              { value: "98%", label: "Success Rate" },
              { value: "4.9/5", label: "User Rating" },
            ].map((item, i) => (
              <div
                key={i}
                className="group rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm px-5 py-6 text-center shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div
                  className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.value}
                </div>

                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-slate-500 font-black group-hover:text-lemon-ink transition-colors">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== ARCHITECTURE =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-white">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* ================= HEADER ================= */}
          <div className="text-center mb-14">
            <p className="text-lemon-ink text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] mb-4">
              Why Choose Us
            </p>

            <h2
              className="font-black uppercase tracking-tight leading-[1.1] text-black"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              The Limbu AI{" "}
              {cityName ? (
                <span className="text-lemon-ink">{cityName}</span>
              ) : null}{" "}
              Advantage
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-[0.22em] max-w-2xl mx-auto">
              Powerful AI infrastructure designed for scalable local business
              growth
            </p>
          </div>

          {/* ================= CARDS ================= */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Fully Automated",
                desc: "Our AI handles posting, reviews, optimization, and reporting automatically.",
              },
              {
                icon: Users,
                title: "Easy Management",
                desc: cityName
                  ? `Manage all your ${cityName} business clients from one dashboard.`
                  : "Manage all your business clients from one dashboard.",
              },
              {
                icon: Star,
                title: "Review Automation",
                desc: "Automatically monitor and reply to customer reviews with AI.",
              },
              {
                icon: BarChart,
                title: "Smart Reports",
                desc: "Track rankings, calls, traffic, and lead growth with simple analytics.",
              },
              {
                icon: Target,
                title: "More Leads",
                desc: cityName
                  ? `Convert ${cityName} search traffic into paying customers.`
                  : "Convert online traffic into paying customers.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                desc: "Protected with encrypted systems, cloud backups, and 24/7 monitoring.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-lemon-hover/40 transition-all duration-500"
              >
                {/* Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-lemon-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                {/* Icon */}
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-black transition-all duration-300">
                  <item.icon className="w-6 h-6 text-black group-hover:text-lemon-glow transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3
                    className="text-lg font-black uppercase tracking-tight text-black mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-bold leading-relaxed">
                    {cityName &&
                    (item.title === "Easy Management" ||
                      item.title === "More Leads") ? (
                      <>
                        {item.title === "Easy Management" ? (
                          <>
                            Manage all your{" "}
                            <span className="text-lemon-ink">{cityName}</span>{" "}
                            business clients from one dashboard.
                          </>
                        ) : (
                          <>
                            Convert{" "}
                            <span className="text-lemon-ink">{cityName}</span>{" "}
                            search traffic into paying customers.
                          </>
                        )}
                      </>
                    ) : (
                      item.desc
                    )}
                  </p>
                </div>

                {/* Bottom Border Animation */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-lemon-hover group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== WHY JOIN =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* ================= HEADER ================= */}
          <div className="text-center mb-14">
            <p className="text-lemon-ink text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] mb-4">
              Franchise Benefits
            </p>

            <h2
              className="font-black uppercase tracking-tight leading-[1.1] text-black"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {cityName ? (
                <>
                  <span className="text-lemon-ink">{cityName}</span> Franchise
                  Benefits
                </>
              ) : (
                "Franchise Benefits"
              )}
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-[0.22em] max-w-2xl mx-auto">
              Build a scalable AI-powered business with recurring revenue and
              exclusive market opportunities
            </p>
          </div>

          {/* ================= BENEFITS GRID ================= */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Rocket,
                title: "Growing Market",
                desc: cityName
                  ? `Every local business in ${cityName} needs online visibility today.`
                  : "Every local business needs online visibility today.",
              },
              {
                icon: DollarSign,
                title: "Recurring Income",
                desc: "Generate predictable monthly revenue from active clients.",
              },
              {
                icon: Shield,
                title: "Proven System",
                desc: "Operate with a tested business model and complete training support.",
              },
              {
                icon: Users,
                title: "Massive Demand",
                desc: cityName
                  ? `Thousands of businesses in ${cityName} need these services.`
                  : "Thousands of businesses need these services.",
              },
              {
                icon: Zap,
                title: "AI Automation",
                desc: "Our AI platform handles most of the operational workload for you.",
              },
              {
                icon: Award,
                title: "Exclusive Territory",
                desc: cityName
                  ? `Get exclusive operating rights in ${cityName}.`
                  : "Get exclusive operating rights in your territory.",
              },
              {
                icon: TrendingUp,
                title: "High Margins",
                desc: "Keep strong profit margins with scalable recurring services.",
              },
              {
                icon: Clock,
                title: "Remote Friendly",
                desc: "Run and manage your business from anywhere with internet access.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-lemon-hover/40 transition-all duration-500"
              >
                {/* Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-lemon-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                {/* Icon */}
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-black transition-all duration-300">
                  <item.icon className="w-6 h-6 text-black group-hover:text-lemon-glow transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3
                    className="text-base sm:text-lg font-black uppercase tracking-tight text-black mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-bold leading-relaxed">
                    {cityName &&
                    (item.title === "Growing Market" ||
                      item.title === "Massive Demand" ||
                      item.title === "Exclusive Territory") ? (
                      <>
                        {item.title === "Growing Market" && (
                          <>
                            Every local business in{" "}
                            <span className="text-lemon-ink">{cityName}</span>{" "}
                            needs online visibility today.
                          </>
                        )}

                        {item.title === "Massive Demand" && (
                          <>
                            Thousands of businesses in{" "}
                            <span className="text-lemon-ink">{cityName}</span>{" "}
                            need these services.
                          </>
                        )}

                        {item.title === "Exclusive Territory" && (
                          <>
                            Get exclusive operating rights in{" "}
                            <span className="text-lemon-ink">{cityName}</span>
                            .
                          </>
                        )}
                      </>
                    ) : (
                      item.desc
                    )}
                  </p>
                </div>

                {/* Bottom Border Animation */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-lemon-hover group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== POPULAR CITIES =================== */}
      <section className="relative py-8 sm:py-8 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-lemon-ink text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                Popular Cities
              </p>
              <h2
                className="font-black uppercase tracking-tight leading-tight text-black"
                style={{
                  fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", // Reduced font size
                  fontFamily: "var(--font-heading)",
                }}
              >
                Explore Franchise{" "}
                <span className="text-lemon-ink">Opportunities</span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md leading-relaxed">
              Select a city to view local franchise details and application
              steps.
            </p>
          </div>

          {/* Updated Grid: More compact cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mostCities.map((city) => {
              const citySlug = createFranchiseCitySlug(city);
              const isActiveCity =
                cityName?.toLowerCase() === city.toLowerCase();

              return (
                <Link
                  key={city}
                  href={`/bussiness/${citySlug}`}
                  className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 ${
                    isActiveCity
                      ? "border-lemon-hover bg-lemon-glow/10 shadow-sm"
                      : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-lemon-hover hover:shadow-md"
                  }`}
                  aria-current={isActiveCity ? "page" : undefined}
                >
                  <span className="truncate text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 group-hover:text-black transition-colors">
                    {city}
                  </span>

                  <ArrowRight
                    size={14}
                    className={`shrink-0 transition-all duration-300 ${
                      isActiveCity
                        ? "text-lemon-ink"
                        : "text-slate-300 group-hover:text-lemon-ink group-hover:translate-x-1"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================== ORBIT DIAGRAM SECTION =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main Container */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm p-6 sm:p-10 lg:p-14">
            {/* Top Badge */}
            <div className="flex justify-center mb-5">
              <span className="bg-lemon-glow/15 text-lemon-ink text-[10px] sm:text-xs font-black px-5 py-2 rounded-full uppercase tracking-[0.28em] border border-lemon-glow/20">
                Franchise Licence
              </span>
            </div>

            {/* Heading */}
            <div className="text-center mb-10">
              <h2
                className="font-black tracking-tight leading-[1.1] text-black"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.2rem)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {cityName ? (
                  <>
                    <span className="text-lemon-ink">{cityName}</span> Smarter
                    Businesses,
                  </>
                ) : (
                  "Smarter Businesses,"
                )}

                <br />

                <span className="text-black">Stronger Futures.</span>
              </h2>

              <p className="mt-5 text-sm sm:text-base text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto">
                Choose the model that fits your ambition — start as a{" "}
                <span className="text-black">Partner Franchise</span> or scale
                your own network as a{" "}
                <span className="text-lemon-ink">Master Franchise</span>.
                {cityName ? (
                  <>
                    {" "}
                    Built specifically for{" "}
                    <span className="text-lemon-ink">{cityName}</span>{" "}
                    businesses.
                  </>
                ) : null}
              </p>
            </div>

            {/* ================= TWO-TIER PLAN CARDS ================= */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 relative z-10">
              {/* ---------- PARTNER FRANCHISE ---------- */}
              <div className="relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-9 shadow-xl">
                {/* Glow Effect */}
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-lemon-glow/10 blur-3xl rounded-full" />

                <div className="relative z-10 flex-1">
                  {/* Tier Label */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      <Users className="w-4 h-4 text-lemon-ink" />
                      Partner Franchise
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      Starter
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <div
                      className="text-4xl sm:text-5xl font-black text-black tracking-tighter"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      ₹5,00,000
                    </div>
                    <div className="mt-1 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      + 18% GST • One-Time Fee
                    </div>
                  </div>

                  {/* Revenue Split */}
                  <div className="grid grid-cols-2 gap-3 my-7">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-sm">
                      <p className="text-2xl font-black text-lemon-ink tracking-tight">
                        50%
                      </p>
                      <p className="mt-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">
                        Direct Business
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-sm">
                      <p className="text-2xl font-black text-black tracking-tight">
                        ₹1-3L
                      </p>
                      <p className="mt-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">
                        Monthly Potential
                      </p>
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3.5">
                    {[
                      "10 active partner slots included",
                      "Unlimited users • no per-seat charges",
                      "50% revenue share on your business",
                      "Exclusive rights in your city",
                    ].map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-4.5 h-4.5 text-lemon-ink shrink-0 mt-0.5" />
                        <span className="text-[13px] font-bold text-slate-600 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  data-franchise-action="open"
                  data-plan="premium"
                  className="relative z-10 mt-8 w-full py-4 rounded-2xl border-2 border-black bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-black hover:text-lemon-glow transition-all duration-300"
                >
                  Get Partner Franchise ↗
                </button>
              </div>

              {/* ---------- MASTER FRANCHISE (HIGHLIGHTED) ---------- */}
              <div className="relative flex flex-col overflow-hidden rounded-[2rem] border-2 border-lemon-hover bg-black p-7 sm:p-9 shadow-2xl">
                {/* Glow Effect */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-lemon-glow/25 blur-3xl rounded-full" />

                {/* Ribbon */}
                <div className="absolute top-6 right-6 z-20 bg-lemon-hover text-black text-[9px] font-black uppercase tracking-[0.18em] px-3.5 py-1.5 rounded-full shadow-lg">
                  Maximum Earning
                </div>

                <div className="relative z-10 flex-1">
                  {/* Tier Label */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-lemon-glow">
                      <Award className="w-4 h-4" />
                      Master Franchise
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="inline-block mb-1.5 text-[10px] font-black text-lemon-glow uppercase tracking-[0.2em]">
                      Starts From
                    </span>
                    <div
                      className="text-4xl sm:text-5xl font-black text-white tracking-tighter"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      ₹20,00,000
                    </div>
                    <div className="mt-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      + 18% GST • One-Time Fee
                    </div>
                  </div>

                  {/* Revenue Split — the percentage process */}
                  <div className="grid grid-cols-2 gap-3 my-7">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center backdrop-blur-sm">
                      <p className="text-2xl font-black text-lemon-glow tracking-tight">
                        50%
                      </p>
                      <p className="mt-1 text-[9px] font-black text-slate-300 uppercase tracking-[0.15em]">
                        Direct Business
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center backdrop-blur-sm">
                      <p className="text-2xl font-black text-lemon-glow tracking-tight">
                        6%
                      </p>
                      <p className="mt-1 text-[9px] font-black text-slate-300 uppercase tracking-[0.15em]">
                        Channel Business
                      </p>
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3.5">
                    {[
                      "Everything in Partner Franchise",
                      "50% revenue share on direct business",
                      "6% override on your channel network",
                      "Appoint & manage sub-franchise partners",
                      "Master rights over your entire territory",
                    ].map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-4.5 h-4.5 text-lemon-glow shrink-0 mt-0.5" />
                        <span className="text-[13px] font-bold text-slate-200 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  data-franchise-action="open"
                  data-plan="master"
                  className="relative z-10 mt-8 w-full py-4 rounded-2xl bg-lemon-hover text-black text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  Become a Master Franchise ↗
                </button>
              </div>
            </div>

            {/* ================= EARNINGS PROCESS EXPLAINER ================= */}
            <div className="relative z-10 mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/60 p-7 sm:p-9">
              <div className="text-center mb-8">
                <p className="text-lemon-ink text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2">
                  How Your Earnings Work
                </p>
                <h3
                  className="text-lg sm:text-2xl font-black text-black tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Two Ways a Master Franchise Earns
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Direct Business */}
                <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Direct Business
                    </span>
                    <span
                      className="text-3xl font-black text-lemon-ink tracking-tighter"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      50%
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-slate-500 leading-relaxed">
                    Clients you onboard and service yourself. You keep{" "}
                    <span className="text-black">50% of the revenue</span> from
                    every business you sign directly.
                  </p>
                </div>

                {/* Channel Business */}
                <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Channel Business
                    </span>
                    <span
                      className="text-3xl font-black text-lemon-ink tracking-tighter"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      6%
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-slate-500 leading-relaxed">
                    Business generated by the sub-franchise partners you appoint.
                    You earn a{" "}
                    <span className="text-black">6% channel override</span> on
                    their revenue — passive income that scales with your network.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                Direct 50% + Channel 6% = build once, earn from your whole network
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FAQ =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* ================= HEADER ================= */}
          <div className="text-center mb-14">
            <p className="text-lemon-ink text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] mb-4">
              Support & Help
            </p>

            <h2
              className="font-black uppercase tracking-tight leading-[1.1] text-black"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Frequently Asked{" "}
              <span className="text-lemon-ink">Questions</span>
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-[0.22em] max-w-2xl mx-auto">
              Everything you need to know before starting your AI franchise
              business
            </p>
          </div>

          {/* ================= FAQ LIST ================= */}
          <div className="space-y-5">
            {[
              {
                q: "Do I Need To Be Good With Computers?",
                a: "Not at all. Our AI system handles the technical work while you focus on managing and growing local business relationships.",
              },
              {
                q: "How Much Time Do I Need To Give?",
                a: "Most franchise partners spend around 3-4 flexible hours daily depending on their business goals and growth plans.",
              },
              {
                q: "When Will I Recover My Investment?",
                a: cityName
                  ? `Most ${cityName} franchise partners recover their investment within 4 to 6 months when following our proven system.`
                  : "Most franchise partners recover their investment within 4 to 6 months when following our proven system.",
              },
              {
                q: "Are There Any Hidden Charges?",
                a: "No hidden fees. After the one-time franchise investment, you continue earning recurring monthly revenue.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-2xl hover:border-lemon-hover/40 transition-all duration-500"
              >
                {/* Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-lemon-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                {/* Question */}
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-lemon-glow/15 border border-lemon-glow/20 flex items-center justify-center shrink-0">
                    <span className="text-lemon-ink font-black text-sm">
                      Q
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-base sm:text-lg font-black uppercase tracking-tight text-black leading-snug"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {faq.q}
                    </h3>

                    <p className="mt-4 text-sm sm:text-base text-slate-500 font-bold leading-relaxed">
                      {cityName &&
                      faq.q === "When Will I Recover My Investment?" ? (
                        <>
                          Most{" "}
                          <span className="text-lemon-ink">{cityName}</span>{" "}
                          franchise partners recover their investment within 4
                          to 6 months when following our proven system.
                        </>
                      ) : (
                        faq.a
                      )}
                    </p>
                  </div>
                </div>

                {/* Bottom Border */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-lemon-hover group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== OUR STORE (city franchise partner) =================== */}
      <OurStoreSection cityName={cityName} />

      {/* =================== FINAL CTA =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* ================= MAIN CARD ================= */}
          <div className="relative overflow-hidden rounded-[2.8rem] border border-slate-200 bg-white shadow-sm hover:shadow-2xl transition-all duration-500">
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-lemon-glow/10 rounded-full blur-3xl" />

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full bg-black text-lemon-glow text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] shadow-lg">
                <span className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />
                Limited Spots Available{" "}
                {cityName ? (
                  <>
                    In <span className="text-white">{cityName}</span>
                  </>
                ) : null}
              </div>

              {/* Heading */}
              <h2
                className="font-black uppercase tracking-tight leading-[1.1] text-black"
                style={{
                  fontSize: "clamp(1.7rem, 3.2vw, 2.8rem)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {cityName ? (
                  <>
                    Start Your{" "}
                    <span className="text-lemon-ink">{cityName}</span>
                  </>
                ) : (
                  "Start Your Business"
                )}

                <br />

                <span className="text-black">Business With Us Today</span>
              </h2>

              {/* Sub Text */}
              <p className="mt-6 text-sm sm:text-base text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto">
                {cityName ? (
                  <>
                    Secure your{" "}
                    <span className="text-lemon-ink">{cityName}</span>{" "}
                    franchise territory before someone else takes it.
                  </>
                ) : (
                  "Secure your franchise territory before someone else takes it."
                )}
              </p>

              {/* CTA */}
              <div className="flex flex-wrap justify-center gap-5 mt-10">
                <button
                  type="button" data-franchise-action="open" data-plan="premium"
                  className="group rounded-2xl bg-black hover:bg-lemon-hover text-white hover:text-black px-10 py-5 text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 shadow-2xl hover:scale-[1.02]"
                >
                  {cityName ? (
                    <>
                      Apply In <span>{cityName}</span>
                    </>
                  ) : (
                    "Apply Now"
                  )}

                  <ArrowRight
                    size={16}
                    className="ml-2 inline transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>
              </div>

              {/* Divider */}
              <div className="mt-14 pt-10 border-t border-slate-200">
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    {
                      value: "tel:+919289344726",
                      icon: PhoneCall,
                      label: "+91 9289344708",
                    },
                    {
                      value: "mailto:info@limbu.ai",
                      icon: MailIcon,
                      label: "info@limbu.ai",
                    },
                  ].map((contact, i) => (
                    <a
                      key={i}
                      href={contact.value}
                      className="group flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 hover:bg-white hover:border-lemon-hover/40 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-black transition-all duration-300">
                        <contact.icon
                          size={16}
                          className="text-black group-hover:text-lemon-glow transition-colors duration-300"
                        />
                      </div>

                      <span className="text-xs sm:text-sm font-black text-black tracking-tight">
                        {contact.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
