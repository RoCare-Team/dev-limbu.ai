import React from 'react';


// Tab Button Component
const TabButton = ({ tab, isActive, onClick, count }) => (

    <button
        onClick={onClick}
       className={`flex items-center justify-center gap-2
px-3 py-3 md:px-4 md:py-4.5
rounded-lg
border-t border-b border-neutral-300
text-xs md:text-sm font-semibold
transition-all min-w-0
shadow-sm hover:shadow-md
${isActive
  ? "bg-gradient-to-r from-neutral-700 via-[#D4A200] to-[#F4B400] text-white border-transparent"
  : "bg-white text-gray-700 hover:bg-gray-50"
}
`}

    >
        <tab.icon className="w-5 h-5 flex-shrink-0" />
        <span className="truncate hidden sm:inline">{tab.label}</span>
        <span className="truncate sm:hidden">{tab.shortLabel || tab.label}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${isActive ? "bg-white/25 text-white" : "bg-neutral-400 text-white"}`}>{count}</span>
    </button>
);

export default TabButton;