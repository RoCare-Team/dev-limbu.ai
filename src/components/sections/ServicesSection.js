
"use client"

import { CheckCircle } from "lucide-react"

export default function ServicesSection({
  servicePlans,
  handleServiceBookClick
}) {

  return (
    <section id="services" className="relative bg-slate-50 py-16 sm:py-20 md:py-24">

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
            Our{" "}
            <span className="bg-primary bg-clip-text text-transparent">
              Service Plans
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">
            Choose the perfect plan for your business growth
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-7xl mx-auto">

          {servicePlans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-2xl shadow-xl border ${
                plan.popular
                  ? "border-purple-500 ring-2 ring-purple-500 ring-offset-2"
                  : "border-slate-200"
              } p-5 flex flex-col`}
            >

              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-700 to-yellow-600 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Title & Price */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {plan.title}
                </h3>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.price}
                  </span>

                  <span className="text-xs text-slate-500 font-medium">
                    {plan.period}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  {plan.subtitle}
                </p>
              </div>

              {/* Features */}
              <div className="flex-grow space-y-4 mb-6">

                {plan.features && (
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start gap-3 text-sm text-slate-600"
                      >
                        <CheckCircle
                          className={`w-5 h-5 ${plan.iconColor} flex-shrink-0`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Optional Sections */}
                {plan.sections &&
                  plan.sections.map((section, sIdx) => (
                    <div key={sIdx}>
                      <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                        {section.title}
                      </h4>

                      <ul className="space-y-3">
                        {section.features.map((feature, fIdx) => (
                          <li
                            key={fIdx}
                            className="flex items-start gap-3 text-sm text-slate-600"
                          >
                            <CheckCircle
                              className={`w-5 h-5 ${plan.iconColor} flex-shrink-0`}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

              </div>

              {/* Tag */}
              {plan.tag && (
                <div className="mb-4 p-2 bg-slate-50 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-100">
                  {plan.tag}
                </div>
              )}

              {/* Button */}
              <button
                onClick={() => handleServiceBookClick(plan)}
                className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 ${plan.buttonColor}`}
              >
                Book Service
              </button>

            </div>
          ))}

        </div>

      </div>
    </section>
  )
}
