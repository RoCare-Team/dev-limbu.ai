import React from 'react';

// Tab Button Component
const TabButton = ({ tab, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-2
          p-3
          rounded-xl border
          transition-all duration-300 min-w-0 w-full relative overflow-hidden group
          ${isActive
            ? "bg-[#EAB308]/10 border-[#EAB308]/50 shadow-[0_0_20px_rgba(253,224,71,0.15)]"
            : "bg-white border-slate-200 hover:border-white/30 hover:bg-slate-50"
          }
        `}
        style={{ fontFamily: "Inter, sans-serif" }}
    >
        {/* Glow Effect for Active State */}
        {isActive && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#EAB308]/20 to-transparent opacity-50 blur-xl"></div>
        )}

        <div className={`p-2 rounded-xl transition-colors relative z-10 ${isActive ? "bg-[#EAB308]/20" : "bg-slate-50 group-hover:bg-slate-100"}`}>
             <tab.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#EAB308]" : "text-slate-900/50"}`} />
        </div>
        
        <div className="flex items-center gap-1.5 relative z-10">
          <span 
            className={`text-xs sm:text-[11px] md:text-xs font-bold tracking-wide uppercase whitespace-nowrap transition-colors ${
                isActive ? "text-[#EAB308]" : "text-slate-900/60 group-hover:text-slate-900/90"
            }`}
          >
            {tab.label}
          </span>
          <span 
            className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${
              isActive ? "bg-[#EAB308] text-black" : "bg-slate-100 text-slate-900/50"
            }`}
          >
            {count}
          </span>
        </div>
    </button>
);

export default TabButton;