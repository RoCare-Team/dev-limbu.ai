import React from "react";

export default function IndustryTimelineSection({ industryName, displaySteps }) {
  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-50 relative">
      <div className="mb-12 lg:mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-4">
          <div className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth Timeline</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight font-heading leading-[1.1] max-w-4xl mx-auto">
          Your Journey To <span className="text-lemon-hover">#1 On Google</span>
        </h2>
        <p className="mt-4 text-slate-500 font-medium max-w-2xl text-lg mx-auto">
          Follow the exact 5-step roadmap Limbu AI uses to transform your {industryName} presence from invisible to unbeatable.
        </p>
      </div>

      <div className="relative max-w-6xl">
        {/* Continuous Vertical Line Connecting Icons */}
        <div className="absolute left-[24px] sm:left-[28px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-lemon-glow via-slate-100 to-transparent -z-10" />

        <div className="grid gap-10 sm:gap-14">
          {displaySteps.map((item, idx) => (
            <div key={idx} className="relative group flex gap-8 sm:gap-12 items-start">
              {/* Icon Indicator (Replaces Numbering) */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-slate-100 text-slate-400 rounded-full flex items-center justify-center shadow-sm group-hover:border-lemon-glow group-hover:bg-lemon-glow group-hover:text-black transition-all duration-500 relative z-10">
                  {React.cloneElement(item.icon, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
                </div>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-lemon-glow/20 rounded-full scale-150 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
              </div>

              {/* Content Area - Full Width */}
              <div className="pt-1 sm:pt-2 flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-lemon-hover transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed w-full">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
