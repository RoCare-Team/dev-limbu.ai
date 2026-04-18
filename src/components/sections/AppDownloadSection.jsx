"use client";

import Image from "next/image";

export default function AppDownloadSection() {
  return (
    <section className="w-full bg-white py-6 border-t border-black/5">
      <div className="max-w-7xl mx-auto px-4">
        <a 
          href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative w-full rounded-lg overflow-hidden shadow-2xl border border-black/5" style={{ aspectRatio: "1280/300" }}>
            <Image
              src="/images/app_template.png"
              alt="Limbu AI App Download"
              fill
              quality={100}
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center hover:scale-[1.01] transition-transform duration-300"
            />
          </div>
        </a>
      </div>
    </section>
  );
}
