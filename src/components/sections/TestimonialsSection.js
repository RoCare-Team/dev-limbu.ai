
"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

export default function TestimonialsSection({
  testimonials,
  currentTestimonial,
  setCurrentTestimonial
}) {

  return (
    <section
      id="testimonials"
      className="relative py-16 sm:py-20 md:py-24"
    >

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4">
            Loved by Businesses{" "}
            <span className="bg-gradient-to-r from-gray-700 to-yellow-500 bg-clip-text text-transparent">
              Like Yours
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-slate-600">
            Real stories from our happy customers
          </p>
        </div>

        {/* Card */}
        <div className="relative">

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 overflow-hidden">

            <div className="absolute top-8 left-8 text-6xl text-blue-100 -z-0">
              ❞
            </div>

            <div className="relative z-10 transition-opacity duration-300">

              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 mb-6 text-center">
                {testimonials[currentTestimonial].quote}
              </p>

              <div className="flex items-center justify-center">
                <img
                  src={testimonials[currentTestimonial].avatar}
                  alt={testimonials[currentTestimonial].author}
                  className="w-12 h-12 rounded-full mr-4 border-2 border-blue-200"
                />

                <div>
                  <div className="font-bold text-slate-900">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-sm text-slate-500">
                    {testimonials[currentTestimonial].title}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Left Button */}
          <button
            onClick={() =>
              setCurrentTestimonial(
                (prev) =>
                  (prev - 1 + testimonials.length) %
                  testimonials.length
              )
            }
            className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-6 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Button */}
          <button
            onClick={() =>
              setCurrentTestimonial(
                (prev) =>
                  (prev + 1) % testimonials.length
              )
            }
            className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

        </div>
      </div>
    </section>
  )
}
