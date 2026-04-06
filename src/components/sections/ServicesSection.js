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
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-32"
      style={{ backgroundColor: "var(--cyber-black)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] z-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse at center, rgba(253,224,71,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/5 backdrop-blur-lg">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#FDE047]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#FDE047]">Pricing Plans</span>
          </div>

          <h2 className="font-normal uppercase leading-[0.9] tracking-tight mb-6" style={{ fontFamily: "Anton, Impact, sans-serif", color: "var(--pure-white)", fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Our <span style={{ WebkitTextStroke: "2px #FDE047", color: "transparent" }}>Service Plans</span>
          </h2>
          
          <p className="text-sm sm:text-lg text-slate-400 max-w-xl mx-auto font-medium">
            Choose the perfect plan for your business growth.
          </p>
        </div>

        {/* ── Flex container ensures perfect centering for any number of cards ── */}
        <div className="flex flex-wrap justify-center gap-8 px-4">
          {servicePlans.map((plan, idx) => (
            <div
              key={idx}
              className="relative flex flex-col rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 w-full max-w-[400px]"
              style={{
                backgroundColor: plan.popular ? "rgba(253,224,71,0.05)" : "rgba(14,14,14,0.85)",
                border: plan.popular ? "1px solid rgba(253,224,71,0.45)" : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-[#FDE047] text-black text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-1 rounded-b-lg shadow-[0_0_20px_rgba(253,224,71,0.4)]">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="flex flex-col flex-1 p-8 sm:p-10 pt-12">
                <div className="mb-8 pb-8 border-b border-white/10">
                  <h3 className="uppercase tracking-tight mb-4 text-2xl font-bold" style={{ fontFamily: "Inter, Impact, sans-serif", color: plan.popular ? "#FDE047" : "var(--pure-white)" }}>
                    {plan.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl text-white" style={{ fontFamily: "Anton, Impact, sans-serif" }}>{plan.price}</span>
                    <span className="text-sm font-medium text-white/50">{plan.period}</span>
                  </div>
                </div>

                <div className="flex-grow space-y-4 mb-8">
                  {plan.features?.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: plan.popular ? "#FDE047" : "rgba(253,224,71,0.5)" }} />
                      <span className="text-sm text-slate-300 truncate" title={feature}>
                        {feature}
                      </span>
                    </div>
                  ))}
                  
                  {plan.sections?.map((section, sIdx) => (
                    <div key={sIdx} className="pt-2">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#FDE047]/60 mb-3" style={{ fontFamily: "Anton, Impact, sans-serif" }}>{section.title}</h4>
                      {section.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-3 mb-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: plan.popular ? "#FDE047" : "rgba(253,224,71,0.5)" }} />
                          <span className="text-sm text-slate-300 truncate" title={feature}>
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
                  className="w-full py-4 rounded-xl text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: plan.popular ? "#FDE047" : "transparent",
                    color: plan.popular ? "#000" : "#FDE047",
                    border: "1px solid #FDE047"
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