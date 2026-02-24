
"use client"

import Image from "next/image"

export default function ClientLogosSection({ clientLogos }) {

  return (
    <section className="bg-white py-12 sm:py-10 border-b border-slate-100">
      <div className="max-w-9xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
            Trusted by Industry Leaders
          </p>

          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>

            <span className="text-sm sm:text-base font-semibold text-slate-600">
              1,000+ Growing Businesses
            </span>
          </div>
        </div>

        {/* Logo Slider */}
        <div className="relative w-full overflow-hidden py-4">

          <div className="flex gap-12 sm:gap-16 md:gap-20 lg:gap-24 animate-scroll-logos items-center w-max hover:[animation-play-state:paused]">

            {[...clientLogos, ...clientLogos, ...clientLogos].map((logo, idx) => (
              <div key={idx} className="flex-shrink-0">

                <div className="h-24 w-40 sm:h-28 sm:w-44 bg-gray-100 rounded-xl shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md hover:bg-gray-200">

                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={160}
                    height={96}
                    className="w-3/4 h-3/4 object-contain"
                  />

                </div>
              </div>
            ))}

          </div>

        </div>
      </div>
    </section>
  )
}
