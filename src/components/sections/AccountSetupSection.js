
"use client"
import { toast } from "react-hot-toast";
import { CheckCircle } from "lucide-react"

export default function AccountSetupSection({ plans, handlePlanClick }) {
  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4">

        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-slate-900">
            Account Setup Services
          </h2>
          <p className="text-slate-600 mt-2">
            Setup your business accounts professionally
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {plans.map((plan, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 flex flex-col hover:scale-105 transition"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {plan.title}
              </h3>

              <p className="text-slate-500 mb-4">
                {plan.description}
              </p>

              <div className="text-3xl font-bold mb-6">
                ₹{plan.basePrice.toLocaleString()}
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plan.staticFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-5 h-5 text-dark" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  handlePlanClick({
                    ...plan,
                    planType: plan.title,
                    price: `₹${plan.basePrice.toLocaleString()}`,
                    gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
                    totalPrice: Math.round(plan.basePrice * 1.18),
                    subtitle: plan.description
                  })
                }
                className="w-full py-3 bg-dark text-primary rounded-xl font-bold hover:shadow-lg transition"
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
