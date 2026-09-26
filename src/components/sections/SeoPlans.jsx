
"use client"

import { CheckCircle } from "lucide-react"

export default function SEOSection({ seoPlans, handlePlanClick }) {
  return (
    <section className="relative bg-white py-12 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12">
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(1.9rem, 4.2vw, 3.2rem)",
            }}
          >
            Our <span style={{ color: "var(--lemon-hover)" }}>SEO Plans</span>
          </h2>

          <p className="text-lg text-slate-600">
            Boost your website ranking with our SEO packages
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {seoPlans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-2xl shadow-xl border ${plan.popular
                ? "border-purple-500 ring-2 ring-purple-500 ring-offset-2"
                : "border-slate-200"
                } p-6 flex flex-col transition-transform hover:scale-105`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-700 to-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
              )}

              <h3 className={`text-xl font-bold ${plan.textColor} mb-2`}>
                {plan.title}
              </h3>

              <p className="text-sm text-slate-500 mb-4">
                {plan.description}
              </p>

              <div className="text-4xl font-bold text-slate-900 mb-6">
                ₹{plan.basePrice.toLocaleString()}
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plan.staticFeatures.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-5 h-5 text-dark" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  handlePlanClick({
                    ...plan,
                    price: plan.basePrice,
                    gstAmount: Math.round(plan.basePrice * 0.18),
                    totalPrice: Math.round(plan.basePrice * 1.18),
                    subtitle: plan.description
                  })
                }
                className={`w-full py-3 rounded-xl font-bold text-primary shadow-lg hover:shadow-xl transition-all ${plan.popular ? "bg-yellow-500 text-white" : "bg-lightPrimary border border-amber-300 text-slate-900"}`}
              >
                Get Started
              </button>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}