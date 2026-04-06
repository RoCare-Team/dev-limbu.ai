"use client";

import { CheckCircle } from "lucide-react";

export default function SubscriptionSection({
  subscriptionPlans,
  billingCycle,
  setBillingCycle,
  calculatePrice,
  getMultiplier,
  handleSubscriptionClick,
}) {
  if (!subscriptionPlans || subscriptionPlans.length === 0) return null;

  const cycles = ["monthly", "quarterly", "yearly"];

  return (
    <section
      id="subscription-plans"
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-32"
      style={{ backgroundColor: "#060606" }}
    >
      {/* ── Scanline texture ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, #FDE047 0px, #FDE047 1px, transparent 1px, transparent 6px)",
        }}
      />

      {/* ── Ambient glow — top right ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-15"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(253,224,71,0.4) 0%, transparent 65%)",
        }}
      />

      {/* ── Ambient glow — bottom left ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[300px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(253,224,71,0.35) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section Header ── */}
        <div className="text-center mb-12 sm:mb-16">

          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(253,224,71,0.06)",
              border: "1px solid rgba(253,224,71,0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#FDE047" }} />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#FDE047" }}>
              Subscription Plans
            </span>
          </div>

          {/* Headline — font-normal strictly */}
          <h2
            className="font-normal uppercase leading-[0.9] tracking-tight mb-4"
            style={{
              fontFamily: "Anton, Impact, sans-serif",
              color: "var(--pure-white)",
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
            }}
          >
            Our{" "}
            <span style={{ WebkitTextStroke: "2px #FDE047", color: "transparent" }}>
              Package
            </span>
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-16 sm:w-24" style={{ background: "rgba(253,224,71,0.25)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FDE047" }} />
            <div className="h-px w-16 sm:w-24" style={{ background: "rgba(253,224,71,0.25)" }} />
          </div>

          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto font-medium mb-10"
            style={{ color: "rgba(226,232,240,0.7)" }}
          >
            Choose the package that suits your business needs.
          </p>

          {/* ── Billing Toggle ── */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-full"
            style={{
              background: "rgba(18,18,18,0.8)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            {cycles.map((cycle) => {
              const active = billingCycle === cycle;
              return (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className="relative px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-300"
                  style={{
                    background: active ? "#FDE047" : "transparent",
                    color: active ? "#000" : "rgba(226,232,240,0.5)",
                    boxShadow: active ? "0 0 16px rgba(253,224,71,0.3)" : "none",
                  }}
                >
                  {cycle === "monthly" ? "Monthly" : cycle === "quarterly" ? "Quarterly" : "Yearly"}
                  {cycle === "quarterly" && !active && (
                    <span
                      className="ml-1.5 text-[9px] font-bold"
                      style={{ color: "rgba(253,224,71,0.7)" }}
                    >
                      -10%
                    </span>
                  )}
                  {cycle === "yearly" && !active && (
                    <span
                      className="ml-1.5 text-[9px] font-bold"
                      style={{ color: "rgba(253,224,71,0.7)" }}
                    >
                      -20%
                    </span>
                  )}
                  {cycle === "quarterly" && active && (
                    <span className="ml-1.5 text-[9px] font-bold text-black">-10%</span>
                  )}
                  {cycle === "yearly" && active && (
                    <span className="ml-1.5 text-[9px] font-bold text-black">-20%</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {subscriptionPlans.map((plan, idx) => {
            const price = calculatePrice(plan.basePrice);
            const multiplier = getMultiplier();

            const displayFeatures = [
              `${plan.basePosts * multiplier} GMB Posts`,
              `${plan.baseCitations * multiplier} Citations`,
              ...plan.staticFeatures,
            ];

            const savings =
              billingCycle !== "monthly"
                ? plan.basePrice *
                    (billingCycle === "quarterly"
                      ? 3
                      : billingCycle === "half-yearly"
                      ? 6
                      : 12) -
                  price
                : 0;

            return (
              <div
                key={idx}
                className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
                style={{
                  backgroundColor: plan.popular
                    ? "rgba(253,224,71,0.05)"
                    : "rgba(12,12,12,0.9)",
                  border: plan.popular
                    ? "1px solid rgba(253,224,71,0.4)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: plan.popular
                    ? "0 0 50px rgba(253,224,71,0.08)"
                    : "none",
                }}
              >
                {/* Popular top bar */}
                {plan.popular && (
                  <div className="h-[2px] w-full" style={{ background: "#FDE047" }} />
                )}

                {/* Popular badge */}
                {plan.popular && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full z-20"
                    style={{
                      background: "#FDE047",
                      boxShadow: "0 0 20px rgba(253,224,71,0.5)",
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex flex-col flex-1 p-6 sm:p-7">

                  {/* Plan title */}
                  <div className="mb-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <h3
                      className="font-normal uppercase tracking-tight mb-3"
                      style={{
                        fontFamily: "Inter, Impact, sans-serif",
                        color: plan.popular ? "#FDE047" : "var(--pure-white)",
                        fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                      }}
                    >
                      {plan.title}
                    </h3>

                    {plan.description && (
                      <p
                        className="text-xs leading-relaxed mb-4"
                        style={{ color: "rgba(226,232,240,0.45)" }}
                      >
                        {plan.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span
                        className="font-normal leading-none"
                        style={{
                          fontFamily: "Anton, Impact, sans-serif",
                          color: "var(--pure-white)",
                          fontSize: "clamp(2rem, 4vw, 2.8rem)",
                        }}
                      >
                        ₹{price.toLocaleString()}
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "rgba(226,232,240,0.4)" }}
                      >
                        {billingCycle === "monthly"
                          ? "/ month"
                          : billingCycle === "quarterly"
                          ? "/ quarter"
                          : billingCycle === "half-yearly"
                          ? "/ 6 months"
                          : "/ year"}
                      </span>
                    </div>

                    <p className="text-[10px] font-medium mb-2" style={{ color: "rgba(226,232,240,0.35)" }}>
                      + 18% GST
                    </p>

                    {/* Savings badge */}
                    {billingCycle !== "monthly" && savings > 0 && (
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          background: "rgba(74,222,128,0.08)",
                          border: "1px solid rgba(74,222,128,0.2)",
                        }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: "#4ade80" }}>
                          Save ₹{savings.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-7 flex-grow">
                    {displayFeatures.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <CheckCircle
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{
                            color: plan.popular ? "#FDE047" : "rgba(253,224,71,0.5)",
                          }}
                        />
                        <span
                          className="text-xs sm:text-sm leading-relaxed"
                          style={{ color: "rgba(226,232,240,0.65)" }}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscriptionClick(plan)}
                    className="w-full py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
                    style={
                      plan.popular
                        ? {
                            background: "#FDE047",
                            color: "#000",
                            boxShadow: "0 0 24px rgba(253,224,71,0.3)",
                          }
                        : {
                            background: "rgba(253,224,71,0.07)",
                            color: "#FDE047",
                            border: "1px solid rgba(253,224,71,0.2)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.background = "rgba(253,224,71,0.13)";
                        e.currentTarget.style.border = "1px solid rgba(253,224,71,0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.background = "rgba(253,224,71,0.07)";
                        e.currentTarget.style.border = "1px solid rgba(253,224,71,0.2)";
                      }
                    }}
                  >
                    Get Started ↗
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}