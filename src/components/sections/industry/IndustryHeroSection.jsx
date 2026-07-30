import React from "react";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { getImageDimensions } from "@/utils/industryImageDimensions";

export default function IndustryHeroSection({ industryName, heroHeading, heroSubheading, whatsappLink, heroImage }) {
  const heroDimensions = getImageDimensions(heroImage);

  return (
    <section className="relative px-4 pt-2 sm:pt-0 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 lg:py-12">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-lemon-glow/10 blur-[120px] rounded-full opacity-60" />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="space-y-6 relative z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lemon-glow/30 bg-lemon-glow/5 mx-auto lg:mx-0 shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full animate-pulse bg-lemon-hover" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-lemon-hover">
              Growth Software for {industryName}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-black leading-[1.15] tracking-tight font-heading">
            {heroHeading.split(" ").map((word, i, arr) => (
              <span key={i} className={i >= arr.length - 3 ? "text-lemon-hover" : ""}>
                {word}{" "}
              </span>
            ))}
          </h1>

          <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {heroSubheading}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto btn-lemon px-7 py-3.5 rounded-xl text-sm font-black shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Book Free Demo
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1 mb-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-lemon-hover fill-current" />
                ))}
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Trusted by 1k+ {industryName}
              </span>
            </div>
          </div>
        </div>

        <div className="relative lg:h-[450px] flex justify-center items-center group">
          <div className="absolute inset-0 bg-gradient-to-tr from-lemon-glow/15 via-transparent to-blue-50/20 rounded-[2.5rem] -z-10 transform rotate-1 group-hover:rotate-0 transition-transform duration-700" />
          {/* Ye LCP element hai. Pehle plain <img> tha, yaani Next ka optimizer
              bypass ho jata tha aur poora original PNG (jaise jim.png = 1.3 MB)
              raw download hota tha. Ab AVIF/WebP me, layout width ke hisaab se. */}
          <Image
            src={heroImage}
            alt={`${industryName} Marketing`}
            width={heroDimensions.width}
            height={heroDimensions.height}
            sizes="(max-width: 1023px) 90vw, 448px"
            priority
            // Next 16 `priority` se preload link banta hai par `<img>` par
            // fetchpriority attribute nahi lagta — Lighthouse ka
            // "fetchpriority=high should be applied to the LCP image" isi wajah
            // se fail hota hai. Isliye explicitly de rahe hain.
            fetchPriority="high"
            className="relative z-10 w-full h-auto max-w-md object-contain drop-shadow-[0_15px_40px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}
