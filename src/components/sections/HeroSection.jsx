import Link from "next/link";
import Image from "next/image";

import HeroButtons from "./HeroButtons";

const clientLogos = [
  { name: "Ro-Care India", src: "/images/clients/ro-care-india.webp" },
  { name: "unnamedd-1", src: "/images/clients/unnamedd-1.png" },
  { name: "Mannubhai", src: "/images/clients/mannubhai-12.png" },
  //  { name: "anup_gupta", src: "/images/clients/anup_gupta.png" },
  // { name: "Mazz", src: "/images/clients/mazz-4.png" },
  // { name: "Gudiya Collection", src: "/images/clients/gudiya_collection-2.png" },
  // { name: "dynamic_drapry", src: "/images/clients/dynamic_drapry-24.png" },
  // { name: "unnamed", src: "/images/clients/unnaed-2.png" },
  { name: "Bpc", src: "/images/clients/Bpc-Spl.jpeg" },
   { name: "Srinus", src: "/images/clients/srinus-logo.jpeg" },
   { name: "Deit-detox", src: "/images/clients/deit2.jpeg" },
  { name: "Indo-motive", src: "/images/clients/indom1.jpeg" },
  { name: "Solution", src: "/images/clients/solution1.jpeg" },
  { name: "Inpect", src: "/images/clients/ispect1.jpeg" },
  { name: "zion1", src: "/images/clients/zoin2.jpeg" },
];

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex flex-col bg-white overflow-hidden text-slate-900 pt-20 lg:pt-28">

      {/* Webinar CTA */}
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

      {/* Hero Body */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center w-full mt-12 md:mt-0">

          {/* Left */}
          <div className="flex flex-col justify-center max-w-2xl mx-auto lg:mx-0 text-center lg:text-left pt-6 lg:pt-0">

            

            {/* Heading */}
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
                  Manage Your{" "}
                  <span className="text-[#eab308]">
                    GMB
                    <br className="hidden lg:block" />
                    with Limbu AI
                  </span>
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                Automate your Google Business Profile. Get daily AI posts,
                authentic 5-star reviews, and instant review replies to dominate
                local search.
              </p>

              {/* Client Interactive Buttons */}
              <HeroButtons />
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full flex items-center justify-center mt-8 lg:mt-0 overflow-hidden">
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

      {/* Logo Slider */}
      <div className="relative z-10 w-full py-4 mt-auto overflow-hidden shrink-0 border-t border-slate-50 bg-slate-50">
        <div className="overflow-hidden">
          <div className="animate-scroll flex items-center w-max">
            {[...clientLogos, ...clientLogos].map((client, i) => (
              <div
  key={i}
  className="shrink-0 px-3"
>
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-24 w-52 flex items-center justify-center p-4">
    <div className="relative w-full h-full">
      <Image
  src={client.src}
  alt={client.name}
  fill
  className={`object-contain ${
    ["Inpect", "Solution", "Deit-detox", "Indo-motive", "zion1"].includes(client.name)
      ? "scale-150"
      : ""
  }`}
/>
    </div>
  </div>
</div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}