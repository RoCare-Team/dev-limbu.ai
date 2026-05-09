

"use client"

import Image from "next/image"

export default function ClientLogosSection({ clientLogos }) {
  return (
    <section className="bg-[#f5f5f5] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-14">

          <p className="text-sm font-semibold uppercase tracking-[0.30em] text-slate-500 mb-5">
            Trusted by Industry Leaders
          </p>

          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Brands That Trust Us
          </h2>

          <p className="mt-5 text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
            Helping businesses across India grow with premium service solutions.
          </p>

        </div>

        {/* Logo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {clientLogos.map((logo, idx) => (
            <div
              key={idx}
              className="
                bg-white
                border border-slate-200
                rounded-2xl

                h-[110px]

                flex items-center justify-center

                transition-all duration-300
                hover:shadow-lg
                hover:-translate-y-1
              "
            >

              <Image
                src={logo.src}
                alt={logo.name}
                width={170}
                height={70}
                className="
                  object-contain
                  max-h-12
                  w-auto

                  grayscale
                  opacity-80

                  hover:grayscale-0
                  hover:opacity-100

                  transition-all duration-300
                "
              />

            </div>
          ))}

        </div>

      </div>
    </section>
  )
}