

"use client"

import { isCheckoutTestPlanKey } from "@/lib/checkoutTestPlan"
import { CheckCircle } from "lucide-react"

export default function SubscriptionSection({
  subscriptionPlans,
  billingCycle,
  setBillingCycle,
  calculatePrice,
  getMultiplier,
  handleSubscriptionClick
}) {

  return (
    <section
      id="subscription-plans"
      className="relative bg-white py-16 sm:py-20 md:py-24 border-t border-slate-100"
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Our GMB{" "}
            <span className="bg-lightPrimary bg-clip-text text-slate-900">
              Package
            </span>
          </h2>

          <p className="text-lg text-slate-600 mb-8">
            Choose the Package that suits your business needs
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {["quarterly", "yearly"].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === cycle
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-dark text-primary hover:bg-slate-200"
                }`}
              >
                {cycle === "quarterly" ? "Quarterly" : "Yearly"}

                {cycle === "quarterly" && (
                  <span className="ml-1 text-xs text-lightPrimary">-20%  (Recommended)</span>
                )}

                

                {cycle === "yearly" && (
                  <span className="ml-1 text-xs text-yellow-400">-50%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">

          {subscriptionPlans
            .filter(
              (plan) =>
                !isCheckoutTestPlanKey(plan?.planKey) &&
                plan?.listOnHomepage !== false,
            )
            .map((plan, idx) => {

            const price = calculatePrice(plan.basePrice)
            const multiplier = getMultiplier()

            // Undiscounted cycle total (monthly rate × months) vs what is payable
            const listPrice = plan.basePrice * multiplier
            const savings = listPrice - price
            const discountPct = listPrice
              ? Math.round((savings / listPrice) * 100)
              : 0
            const cycleTotalLabel =
              billingCycle === "quarterly"
                ? "Quarterly total (3 months)"
                : billingCycle === "half-yearly"
                ? "6 month total"
                : billingCycle === "yearly"
                ? "Yearly total (12 months)"
                : "Monthly total"

            const displayFeatures = [
              `${plan.basePosts * multiplier} GMB Posts`,
              // Plans without citations (Basic) skip the line entirely
              ...(plan.baseCitations
                ? [`${plan.baseCitations * multiplier} Citations`]
                : []),
              ...plan.staticFeatures,
              // Social Media Management is an annual-only perk — unlocked only on the Yearly cycle, for all 3 plans
              ...(billingCycle === "yearly" ? ["Social Media Management"] : []),
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

                  {/* Monthly rate leads; the cycle total sits below it */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      ₹{plan.basePrice.toLocaleString()}
                    </span>

                    <span className="text-sm text-slate-500 font-medium">
                      / month
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium mt-1">
                    + 18% GST
                  </div>

                  {/* Cycle total — list price struck through, payable price highlighted */}
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      {cycleTotalLabel}
                    </div>

                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        ₹{listPrice.toLocaleString()}
                      </span>

                      <span className="text-2xl font-extrabold text-green-600">
                        ₹{price.toLocaleString()}
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="text-xs font-bold text-green-700 mt-0.5">
                        You save ₹{savings.toLocaleString()} ({discountPct}% off)
                      </div>
                    )}
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
                  onClick={() => handleSubscriptionClick(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-lightPrimary   shadow-lg hover:shadow-xl transition-all bg-amber-400 hover:bg-amber-500`}
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
