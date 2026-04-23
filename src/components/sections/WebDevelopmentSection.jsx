"use client";

import { CheckCircle } from "lucide-react";

export default function WebDevelopmentSection({ webPlans, handlePlanClick }) {
  if (!webPlans || webPlans.length === 0) return null;

  return (
    <section
      id="web-development"
      className="relative w-full overflow-hidden py-12 border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glow — top right ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section Header ── */}
        <div className="text-center mb-10 sm:mb-12">

          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--lemon-hover)" }} />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--lemon-hover)" }}>
              Development Studio
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(2rem, 5vw, 4rem)",
            }}
          >
            Premium <span style={{ color: "var(--lemon-hover)" }}>Web Experience</span>
          </h2>

          <p
            className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-semibold mb-8"
            style={{ color: "rgba(15, 23, 42, 0.85)" }}
          >
            High-performance, conversion-optimized websites tailored for local dominance and global scale.
          </p>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {webPlans.map((plan, idx) => {
            const displayFeatures = [
              `${plan.basePages} Professional Pages`,
              ...plan.staticFeatures,
            ];

            return (
              <div
                key={idx}
                className="relative flex flex-col transition-all duration-500 hover:-translate-y-1 mt-4"
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full z-20 w-max"
                    style={{
                      background: "var(--lemon-hover)",
                      boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.4)",
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">
                      Recommended
                    </span>
                  </div>
                )}

                <div
                  className="relative flex flex-col flex-1 rounded-3xl overflow-hidden bg-white border transition-shadow duration-500 hover:shadow-2xl"
                  style={{
                    borderColor: plan.popular ? "rgba(250, 204, 21, 0.4)" : "rgba(15, 23, 42, 0.1)",
                    boxShadow: plan.popular ? "0 20px 40px -10px rgba(0,0,0,0.05)" : "0 10px 30px -10px rgba(0,0,0,0.02)",
                  }}
                >
                  <div className="flex flex-col flex-1 p-7 sm:p-8">

                    {/* Plan title */}
                    <div className="mb-6 pb-6 border-b border-slate-100">
                      <h3
                        className="font-bold uppercase tracking-tight mb-2"
                        style={{
                          fontFamily: "var(--font-heading)",
                          color: plan.popular ? "var(--lemon-hover)" : "var(--foreground)",
                          fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
                        }}
                      >
                        {plan.title}
                      </h3>

                      {plan.description && (
                        <p
                          className="text-xs leading-relaxed mb-4 font-semibold"
                          style={{ color: "rgba(15, 23, 42, 0.6)" }}
                        >
                          {plan.description}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span
                          className="font-black leading-none text-black"
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(2rem, 4vw, 2.5rem)",
                          }}
                        >
                          ₹{plan.basePrice.toLocaleString()}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: "rgba(15, 23, 42, 0.6)" }}
                        >
                          / One-Time
                        </span>
                      </div>

                      <p className="text-[10px] font-bold mb-3" style={{ color: "rgba(15, 23, 42, 0.5)" }}>
                        + 18% GST (Total: ₹{Math.round(plan.basePrice * 1.18).toLocaleString()})
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8 flex-grow">
                      {displayFeatures.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3">
                          <CheckCircle
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{
                              color: plan.popular ? "var(--lemon-hover)" : "rgba(234, 179, 8, 0.6)",
                            }}
                          />
                          <span
                            className="text-sm leading-relaxed font-semibold"
                            style={{ color: "rgba(15, 23, 42, 0.85)" }}
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
                          gstAmount: `₹${Math.round(
                            plan.basePrice * 0.18
                          ).toLocaleString()}`,
                          totalPrice: `₹${Math.round(
                            plan.basePrice * 1.18
                          ).toLocaleString()}`,
                          subtitle: plan.description,
                        })
                      }
                      className="w-full py-4 rounded-2xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      style={
                        plan.popular
                          ? {
                            background: "var(--lemon-hover)",
                            color: "#fff",
                            border: "none",
                            boxShadow: "0 10px 20px -5px rgba(234, 179, 8, 0.3)",
                          }
                          : {
                            background: "transparent",
                            color: "var(--lemon-hover)",
                            border: "2px solid rgba(234, 179, 8, 0.2)",
                          }
                      }
                      onMouseEnter={(e) => {
                        if (!plan.popular) {
                          e.currentTarget.style.borderColor = "var(--lemon-hover)";
                          e.currentTarget.style.background = "rgba(250, 204, 21, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!plan.popular) {
                          e.currentTarget.style.borderColor = "rgba(234, 179, 8, 0.2)";
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      Select Plan ↗
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
