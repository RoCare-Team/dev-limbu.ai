"use client";

import { CheckCircle } from "lucide-react";

export default function AccountSetupSection({ plans, handlePlanClick }) {
  if (!plans || plans.length === 0) return null;

  return (
    <section
      id="account-setup"
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-32"
      style={{ backgroundColor: "var(--cyber-black)" }}
    >
      {/* ── Background Glows ── */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] z-0 opacity-10" style={{ background: "radial-gradient(ellipse at center, rgba(253,224,71,0.5) 0%, transparent 65%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Heading */}
        <div className="text-center mb-20">
          <h2
            className="font-normal uppercase leading-[0.9] tracking-tight mb-6"
            style={{
              fontFamily: "Anton, Impact, sans-serif",
              color: "var(--pure-white)",
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
            }}
          >
            Account <span style={{ WebkitTextStroke: "2px #FDE047", color: "transparent" }}>Setup Services</span>
          </h2>
          <p className="text-base md:text-lg opacity-70 max-w-xl mx-auto" style={{ color: "var(--pure-white)" }}>
            Professional Google & Meta account setup to jumpstart your digital presence.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className="relative flex flex-col rounded-2xl transition-all duration-500 hover:-translate-y-1 mt-6"
              style={{
                backgroundColor: "rgba(12,12,12,0.9)",
                border: plan.popular ? "1px solid rgba(253,224,71,0.45)" : "1px solid rgba(255,255,255,0.07)",
                boxShadow: plan.popular ? "0 0 50px rgba(253,224,71,0.1)" : "none",
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <div
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                    style={{
                      background: "#FDE047",
                      boxShadow: "0 0 24px rgba(253,224,71,0.6), 0 4px 12px rgba(0,0,0,0.4)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">Most Popular</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col flex-1 p-8 pt-10">
                {/* Title & Price */}
                <div className="mb-8 pb-6 border-b border-white/10">
                  <h3
                    className="font-normal uppercase tracking-tight mb-3"
                    style={{
                      fontFamily: "Inter, Impact, sans-serif",
                      color: plan.popular ? "#FDE047" : "var(--pure-white)",
                      fontSize: "1.75rem",
                    }}
                  >
                    {plan.title}
                  </h3>
                  <p className="text-sm opacity-60 mb-6" style={{ color: "var(--pure-white)" }}>{plan.description}</p>
                  
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-normal text-4xl" style={{ color: "var(--pure-white)" }}>
                      ₹{plan.basePrice.toLocaleString()}
                    </span>
                    <span className="text-xs opacity-40">/ one-time</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.staticFeatures.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#FDE047" }} />
                      <span className="text-sm opacity-80" style={{ color: "var(--pure-white)" }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() =>
                    handlePlanClick({
                      ...plan,
                      planType: plan.title,
                      price: `₹${plan.basePrice.toLocaleString()}`,
                      gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
                      totalPrice: Math.round(plan.basePrice * 1.18),
                      subtitle: plan.description,
                    })
                  }
                  className="w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={
                    plan.popular
                      ? { background: "#FDE047", color: "#000" }
                      : { background: "rgba(253,224,71,0.07)", color: "#FDE047", border: "1px solid rgba(253,224,71,0.22)" }
                  }
                >
                  Get Started ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}