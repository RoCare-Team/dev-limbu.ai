
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/useAuthStore";

const clientLogos = [
  // { name: "Anup Gupta", src: "/images/clients/anup_gupta_ai.png" },
  { name: "Ro-Care India", src: "/images/clients/ro-care-india.webp" },
  { name: "unnamedd-1", src: "/images/clients/unnamedd-1.png" },
  { name: "Mannubhai", src: "/images/clients/mannubhai-12.png" },
  { name: "Banjara Salon", src: "/images/clients/banjara_salon-3.png" },
  { name: "Mazz", src: "/images/clients/mazz-4.png" },
  { name: "Gudiya Collection", src: "/images/clients/gudiya_collection-2.png" },
   { name: "dynamic_drapry-1", src: "/images/clients/dynamic_drapry-23.png" },
  { name: "unnamed", src: "/images/clients/unnamed-2.png" },
  { name: "Lucky Dry", src: "/images/clients/bpc-1-2.png" },
  { name: "ssd logo", src: "/images/clients/srinus-2.png" },
  
];



export default function HeroSection() {
  const setSelectedVideo = useAuthStore((state) => state.setSelectedVideo);
  const { isLoggedIn } = useAuthStore();

  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex flex-col bg-white overflow-hidden text-slate-900 pt-20 lg:pt-28">

      {/* ── Webinar CTA Badge (Fixed Absolute Position) ── */}
      <div className="absolute top-22 md:top-24 right-2 md:right-10 lg:right-16 z-30 scale-90 sm:scale-100 origin-top-right">
        <Link
          href="/webinar-demo"
          className="flex items-center gap-2 px-3 py-2 rounded-xl group bg-white border border-slate-200 shadow-md hover:shadow-lg transition-all"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] animate-pulse" />
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-bold whitespace-nowrap text-slate-900">
              Free AI Webinar
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              🔥 128 joined in last 1 hr
            </span>
          </div>
          <span className="text-xs transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 text-[#eab308] font-bold">
            ↗
          </span>
        </Link>
      </div>

      {/* ── Main Hero Body (Two Columns) ── */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center w-full mt-12 md:mt-0">

          {/* ── Left Content ── */}
          <div className="flex flex-col justify-center max-w-2xl mx-auto lg:mx-0 text-center lg:text-left pt-6 lg:pt-0">
            {/* Rating Badge */}
            <div className="mb-6 flex justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-yellow-50 border border-yellow-200 shadow-sm">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-xs font-bold text-yellow-800">
                  4.8 on Capterra
                </span>
                <span className="text-xs font-medium text-yellow-600">
                  · 706 reviews
                </span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1
                className="font-extrabold uppercase leading-[1.15] tracking-tight"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
                }}
              >
                <span className="block text-[0.45em] text-slate-500 tracking-widest mb-3 font-semibold">
                  Grow Your Business on Google
                </span>

                <span className="block text-[0.8em] text-slate-900 mt-1">
                  Manage Your <span className="text-[#eab308]">GMB<br className="hidden lg:block" /> with Limbu AI</span>
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                Automate your Google Business Profile. Get daily AI posts, authentic 5-star reviews, and instant review replies to dominate local search.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-8">
                {isLoggedIn ? (
                  <Link href="/dashboard" className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-[#eab308] text-slate-900 font-bold text-sm hover:bg-[#ca8a04] transition-all shadow-[0_4px_14px_0_rgba(234,179,8,0.39)]">
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-[#eab308] text-slate-900 font-bold text-sm hover:bg-[#ca8a04] transition-all shadow-[0_4px_14px_0_rgba(234,179,8,0.39)]">
                    Start Today Get 500 Coins
                  </Link>
                )}
                <button
                  className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all group"
                  onClick={() => setSelectedVideo("https://youtu.be/eQUd6u36w3g?si=_AJ3OymZQD6HnXRl")}
                >
                  Watch Demo
                  <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Image ── */}
          <div className="relative w-full flex items-center justify-center mt-8 lg:mt-0 overflow-hidden">

            {/* Image Container with controlled height */}
            <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[480px]">
              <Image
                src="/images/hero8.jpeg"
                alt="Limbu AI Dashboard UI"
                fill
                className="object-contain mix-blend-multiply rounded-xl"
                priority
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Logo Slider ── */}
      <div className="relative z-10 w-full py-6 mt-auto overflow-hidden shrink-0 border-t border-slate-100 bg-slate-50">
        <div className="overflow-hidden">
          <div className="animate-scroll flex items-center w-max">
            {[...clientLogos, ...clientLogos].map((client, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center px-6 sm:px-8"
              >
                <div className="relative h-10 sm:h-12 w-28 sm:w-36">
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>

                <span className="ml-6 sm:ml-8 text-lg text-slate-200">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
