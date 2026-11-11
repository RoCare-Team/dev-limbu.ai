"use client";

import { CheckCircle } from "lucide-react";

export default function WhatsappPlansSection({ plans, handlePlanClick }) {
  return (
    <section className="relative bg-white py-16 sm:py-20 md:py-24 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(1.9rem, 4.2vw, 3.2rem)",
            }}
          >
            Whatsapp <span style={{ color: "var(--lemon-hover)" }}>Automation Plan</span>
          </h2>

          <p className="text-lg text-slate-600">
            Automate your business communication with WhatsApp
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-2xl shadow-xl border border-yellow-500 ring-2 ring-yellow-500 ring-offset-2 p-6 flex flex-col transition-transform hover:scale-105"
            >
              {/* Badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-700 to-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                Most Popular
              </div>

              {/* Title */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {plan.title}
                </h3>

                <p className="text-sm text-slate-500 mb-4">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">
                    ₹{plan.basePrice.toLocaleString()}
                  </span>

                  <span className="text-sm text-slate-500 font-medium">
                    / One year
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-medium mt-1">
                  + 18% GST (Total: ₹
                  {Math.round(plan.basePrice * 1.18).toLocaleString()})
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.staticFeatures.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <CheckCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  handlePlanClick({
                    title: plan.title,
                    planType: "our-package",
                    planDuration: "yearly", // priced per year ("/ One year"), so 12 months of access
                    price: `₹${plan.basePrice.toLocaleString()}`,
                    totalPrice: Math.round(plan.basePrice * 1.18),
                    gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
                    subtitle: plan.description,
                    features: plan.staticFeatures,
                  })
                }
                className="w-full py-3 rounded-xl font-bold text-lightPrimary shadow-lg hover:shadow-xl transition-all bg-amber-400 hover:bg-amber-500"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
