"use client";

import { CheckCircle } from "lucide-react";

export default function ServicesSection({
  servicePlans,
  handleServiceBookClick,
}) {
  if (!servicePlans || servicePlans.length === 0) return null;

  return (
    <section
      id="services"
      className="relative w-full overflow-hidden py-12 border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 backdrop-blur-lg">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-yellow-500" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-yellow-700">Pricing Plans</span>
          </div>

          <h2 className="font-bold uppercase leading-[0.95] tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)", fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Our <span style={{ color: "var(--lemon-hover)" }}>Service Plans</span>
          </h2>
          
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-semibold">
            Choose the perfect plan for your business growth.
          </p>
        </div>

        {/* ── Flex container ensures perfect centering ── */}
        <div className="flex flex-wrap justify-center gap-8 px-4">
          {servicePlans.map((plan, idx) => (
            <div
              key={idx}
              className="relative flex flex-col rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 w-full max-w-[400px] bg-white border shadow-sm hover:shadow-xl"
              style={{
                borderColor: plan.popular ? "rgba(250, 204, 21, 0.4)" : "rgba(15, 23, 42, 0.05)",
                backgroundColor: plan.popular ? "rgba(250, 204, 21, 0.02)" : "#ffffff",
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-[#eab308] text-white text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-1 rounded-b-lg shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="flex flex-col flex-1 p-8 sm:p-10 pt-12">
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <h3 className="uppercase tracking-tight mb-3 text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: plan.popular ? "#eab308" : "var(--foreground)" }}>
                    {plan.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-black" style={{ fontFamily: "var(--font-heading)" }}>{plan.price}</span>
                    <span className="text-sm font-bold text-slate-400">{plan.period}</span>
                  </div>
                </div>

                <div className="flex-grow space-y-4 mb-8">
                  {plan.features?.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: plan.popular ? "#eab308" : "rgba(234, 179, 8, 0.4)" }} />
                      <span className="text-sm text-slate-600 font-semibold truncate" title={feature}>
                        {feature}
                      </span>
                    </div>
                  ))}
                  
                  {plan.sections?.map((section, sIdx) => (
                    <div key={sIdx} className="pt-2">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>{section.title}</h4>
                      {section.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-3 mb-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: plan.popular ? "#eab308" : "rgba(234, 179, 8, 0.4)" }} />
                          <span className="text-sm text-slate-600 font-semibold truncate" title={feature}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* ── Button ── */}
                <button
                  onClick={() => handleServiceBookClick(plan)}
                  className="w-full py-4 rounded-xl text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: plan.popular ? "#eab308" : "transparent",
                    color: plan.popular ? "#fff" : "#eab308",
                    border: plan.popular ? "none" : "1px solid #eab308"
                  }}
                >
                  Book Service ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}