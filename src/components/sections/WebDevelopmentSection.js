"use client";

import { CheckCircle } from "lucide-react";

export default function WebDevelopmentSection({ webPlans, handlePlanClick }) {
  if (!webPlans || webPlans.length === 0) return null;

  return (
    <section
      id="web-development"
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-32"
      style={{ backgroundColor: "var(--cyber-black)" }}
    >
      {/* ── Diagonal split glow — top left ── */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(253,224,71,0.5) 0%, transparent 65%)",
        }}
      />

      {/* ── Bottom right glow ── */}
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(253,224,71,0.4) 0%, transparent 65%)",
        }}
      />

      {/* ── Horizontal bottom rule ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-20"
        style={{
          background:
            "linear-gradient(to right, transparent, #FDE047 30%, #FDE047 70%, transparent)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section Header ── */}
        <div className="text-center mb-14 sm:mb-20">

          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(253,224,71,0.06)",
              border: "1px solid rgba(253,224,71,0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#FDE047" }}
            />
            <span
              className="text-[11px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: "#FDE047" }}
            >
              Web Development
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
            <span
              style={{
                WebkitTextStroke: "2px #FDE047",
                color: "transparent",
              }}
            >
              Web Development
            </span>
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-16 sm:w-24" style={{ background: "rgba(253,224,71,0.25)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FDE047" }} />
            <div className="h-px w-16 sm:w-24" style={{ background: "rgba(253,224,71,0.25)" }} />
          </div>

          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto font-medium"
            style={{ color: "rgba(226,232,240,0.7)" }}
          >
            Choose the perfect website package for your business.
          </p>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {webPlans.map((plan, idx) => {
            const displayFeatures = [
              `${plan.basePages} Website Pages`,
              ...plan.staticFeatures,
            ];

            return (
              <div
                key={idx}
                className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
                style={{
                  backgroundColor: plan.popular
                    ? "rgba(253,224,71,0.05)"
                    : "rgba(12,12,12,0.9)",
                  border: plan.popular
                    ? "1px solid rgba(253,224,71,0.45)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: plan.popular
                    ? "0 0 50px rgba(253,224,71,0.1), 0 0 0 1px rgba(253,224,71,0.1)"
                    : "none",
                }}
              >
                {/* Popular — solid top bar */}
                {plan.popular && (
                  <div
                    className="h-[3px] w-full flex-shrink-0"
                    style={{ background: "linear-gradient(90deg, #FDE047, rgba(253,224,71,0.4))" }}
                  />
                )}

                {/* Popular badge — clearly visible above card */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                      style={{
                        background: "#FDE047",
                        boxShadow: "0 0 24px rgba(253,224,71,0.6), 0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: "#000" }}
                      />
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">
                        Most Popular
                      </span>
                    </div>
                  </div>
                )}

                {/* Corner accents on popular */}
                {plan.popular && (
                  <>
                    <div
                      className="absolute top-0 right-0 w-8 h-8"
                      style={{ borderTop: "2px solid rgba(253,224,71,0.6)", borderRight: "2px solid rgba(253,224,71,0.6)" }}
                    />
                    <div
                      className="absolute bottom-0 left-0 w-8 h-8"
                      style={{ borderBottom: "2px solid rgba(253,224,71,0.6)", borderLeft: "2px solid rgba(253,224,71,0.6)" }}
                    />
                  </>
                )}

                <div className={`flex flex-col flex-1 p-6 sm:p-7 ${plan.popular ? "pt-8" : ""}`}>

                  {/* Title + description + price */}
                  <div
                    className="mb-6 pb-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {/* Plan name — font-normal */}
                    <h3
                      className="font-normal uppercase tracking-tight mb-2"
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
                        style={{ color: "rgba(226,232,240,0.45)", minHeight: "2.5rem" }}
                      >
                        {plan.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="font-normal leading-none"
                        style={{
                          fontFamily: "Anton, Impact, sans-serif",
                          color: "var(--pure-white)",
                          fontSize: "clamp(2rem, 4vw, 2.8rem)",
                        }}
                      >
                        ₹{plan.basePrice.toLocaleString()}
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "rgba(226,232,240,0.4)" }}
                      >
                        / one-time
                      </span>
                    </div>

                    {/* GST note */}
                    <p
                      className="text-[10px] font-medium mt-1"
                      style={{ color: "rgba(226,232,240,0.3)" }}
                    >
                      + 18% GST = ₹{Math.round(plan.basePrice * 1.18).toLocaleString()} total
                    </p>
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
                    onClick={() =>
                      handlePlanClick({
                        ...plan,
                        price: `₹${plan.basePrice.toLocaleString()}`,
                        gstAmount: `₹${Math.round(plan.basePrice * 0.18).toLocaleString()}`,
                        totalPrice: `₹${Math.round(plan.basePrice * 1.18).toLocaleString()}`,
                        subtitle: plan.description,
                      })
                    }
                    className="w-full py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
                    style={
                      plan.popular
                        ? {
                            background: "#FDE047",
                            color: "#000",
                            boxShadow: "0 0 24px rgba(253,224,71,0.35)",
                          }
                        : {
                            background: "rgba(253,224,71,0.07)",
                            color: "#FDE047",
                            border: "1px solid rgba(253,224,71,0.22)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.background = "rgba(253,224,71,0.13)";
                        e.currentTarget.style.border = "1px solid rgba(253,224,71,0.42)";
                      } else {
                        e.currentTarget.style.boxShadow = "0 0 36px rgba(253,224,71,0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.background = "rgba(253,224,71,0.07)";
                        e.currentTarget.style.border = "1px solid rgba(253,224,71,0.22)";
                      } else {
                        e.currentTarget.style.boxShadow = "0 0 24px rgba(253,224,71,0.35)";
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