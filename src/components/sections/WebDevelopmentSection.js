
"use client"

import { CheckCircle } from "lucide-react"

export default function WebDevelopmentSection({
  webPlans,
  handlePlanClick
}) {
  return (
    <section className="relative bg-white py-16 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Our{" "}
            <span className="bg-primary bg-clip-text text-transparent">
              Web Development
            </span>
          </h2>

          <p className="text-lg text-slate-600">
            Choose the perfect website package for your business
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">

          {webPlans.map((plan, idx) => {

            const displayFeatures = [
              `${plan.basePages} Website Pages`,
              ...plan.staticFeatures
            ]

            return (
              <div
                key={idx}
                className={`relative bg-white rounded-2xl shadow-xl border ${
                  plan.popular
                    ? "border-purple-500 ring-2 ring-purple-500 ring-offset-2"
                    : "border-slate-200"
                } p-6 flex flex-col transition-transform hover:scale-105`}
              >

                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-700 to-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Title */}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${plan.textColor} mb-2`}>
                    {plan.title}
                  </h3>

                  <p className="text-sm text-slate-500 mb-4 h-10">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      ₹{plan.basePrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      / one-time
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-grow">
                  {displayFeatures.map((feature, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${plan.textColor} flex-shrink-0`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() =>
  handlePlanClick({
    ...plan,
    price: `₹${plan.basePrice.toLocaleString()}`,
    gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
    totalPrice: `₹${Math.round(plan.basePrice * 1.18).toLocaleString()}`,
    subtitle: plan.description
  })
}
                  className={`w-full py-3 rounded-xl font-bold text-primary shadow-lg hover:shadow-xl transition-all ${plan.color}`}
                >
                  Get Started
                </button>

              </div>
            )
          })}

        </div>
      </div>
    </section>
  )
}
