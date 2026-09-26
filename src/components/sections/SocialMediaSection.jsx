"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

/**
 * Social media reel plans. Prices are per month; the cycle discounts here are
 * their own (10% quarterly, 20% yearly) — the GMB packages use different ones.
 */
const CYCLES = [
  { key: "monthly", label: "Monthly", months: 1, discount: 0 },
  { key: "quarterly", label: "Quarterly", months: 3, discount: 0.1 },
  { key: "yearly", label: "Yearly", months: 12, discount: 0.2 },
];

export default function SocialMediaSection({ socialPlans, handlePlanClick }) {
  const [cycleKey, setCycleKey] = useState("monthly");

  if (!socialPlans || socialPlans.length === 0) return null;

  const cycle = CYCLES.find((c) => c.key === cycleKey) || CYCLES[0];
  const suffix =
    cycle.key === "monthly"
      ? "/ mo"
      : cycle.key === "quarterly"
        ? "/ quarter"
        : "/ year";

  return (
    <section
      id="social-media-plans"
      className="relative w-full overflow-hidden py-12 border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Ambient glow — top right ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Section Header ── */}
        <div className="text-center mb-10 sm:mb-12">
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--lemon-hover)" }}
            />
            <span
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "var(--lemon-hover)" }}
            >
              Social Media
            </span>
          </div>

          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(2rem, 5vw, 4rem)",
            }}
          >
            Social Media{" "}
            <span style={{ color: "var(--lemon-hover)" }}>Plans</span>
          </h2>

          <p
            className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-semibold mb-8"
            style={{ color: "rgba(15, 23, 42, 0.85)" }}
          >
            Reels made, edited and posted for your brand every month.
          </p>

          {/* ── Billing Toggle ── */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200">
            {CYCLES.map((c) => {
              const active = cycleKey === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCycleKey(c.key)}
                  className="relative px-4 sm:px-6 py-2 rounded-full text-xs font-bold tracking-[0.05em] uppercase transition-all duration-300 cursor-pointer"
                  style={{
                    background: active ? "#ffffff" : "transparent",
                    color: active
                      ? "var(--foreground)"
                      : "rgba(15, 23, 42, 0.6)",
                    boxShadow: active ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  {c.label}
                  {c.discount > 0 && (
                    <span
                      className={`ml-1.5 text-[9px] font-bold ${active ? "text-green-600" : "text-slate-500"}`}
                    >
                      -{Math.round(c.discount * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 justify-center">
          {socialPlans.map((plan, idx) => {
            const listPrice = plan.basePrice * cycle.months;
            const price = Math.round(listPrice * (1 - cycle.discount));
            const savings = listPrice - price;
            const discountPct = Math.round(cycle.discount * 100);
            const gst = Math.round(price * 0.18);
            const reels = plan.baseReels * cycle.months;

            const features = [
              `${reels} Reels${cycle.key === "monthly" ? " per Month" : ""}`,
              ...(plan.staticFeatures || []),
            ];

            return (
              <div
                key={idx}
                className="relative flex flex-col transition-all duration-500 hover:-translate-y-1 mt-4"
              >
                {plan.popular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full z-20 w-max"
                    style={{
                      background: "var(--lemon-hover)",
                      boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.4)",
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div
                  className="relative flex flex-col flex-1 rounded-3xl overflow-hidden bg-white border transition-shadow duration-500 hover:shadow-2xl"
                  style={{
                    borderColor: plan.popular
                      ? "rgba(250, 204, 21, 0.4)"
                      : "rgba(15, 23, 42, 0.1)",
                    boxShadow: plan.popular
                      ? "0 20px 40px -10px rgba(0,0,0,0.05)"
                      : "0 10px 30px -10px rgba(0,0,0,0.02)",
                  }}
                >
                  <div className="flex flex-col flex-1 p-7 sm:p-8">
                    <div className="mb-6 pb-6 border-b border-slate-100">
                      <h3
                        className="font-bold uppercase tracking-tight mb-2"
                        style={{
                          fontFamily: "var(--font-heading)",
                          color: plan.popular
                            ? "var(--lemon-hover)"
                            : "var(--foreground)",
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

                      {/* Struck list price + discount badge */}
                      {savings > 0 && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold text-slate-400 line-through decoration-red-500 decoration-[3px]">
                            ₹{listPrice.toLocaleString()}
                          </span>
                          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                            {discountPct}% OFF
                          </span>
                        </div>
                      )}

                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span
                          className="font-black leading-none text-black"
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(2rem, 4vw, 2.5rem)",
                          }}
                        >
                          ₹{price.toLocaleString()}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: "rgba(15, 23, 42, 0.6)" }}
                        >
                          {suffix}
                        </span>
                      </div>

                      <p
                        className="text-[10px] font-bold mb-3"
                        style={{ color: "rgba(15, 23, 42, 0.5)" }}
                      >
                        + 18% GST
                      </p>

                      {savings > 0 && (
                        <div className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                          You save ₹{savings.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8 flex-grow">
                      {features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3">
                          <CheckCircle
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{
                              color: plan.popular
                                ? "var(--lemon-hover)"
                                : "rgba(234, 179, 8, 0.6)",
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

                    <button
                      onClick={() =>
                        handlePlanClick({
                          title: plan.title,
                          planType: "Social Media",
                          planDuration: cycle.key,
                          price: `₹${price.toLocaleString()}`,
                          gstAmount: `₹${gst.toLocaleString()}`,
                          totalPrice: price + gst,
                          subtitle: plan.description,
                          features,
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
                          e.currentTarget.style.background =
                            "rgba(250, 204, 21, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!plan.popular) {
                          e.currentTarget.style.borderColor =
                            "rgba(234, 179, 8, 0.2)";
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      Get Started ↗
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
