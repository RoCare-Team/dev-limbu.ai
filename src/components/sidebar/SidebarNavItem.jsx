import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const SidebarNavItem = React.memo(({
  item,
  collapsed,
  isActive,
  isDropdownOpen,
  onToggleDropdown,
  onNavigate,
  pathname,
}) => {
  const isDropdown = !!item.children;
  
  return (
    <div className="px-3 mb-0.5">
      <button
        onClick={() => isDropdown ? onToggleDropdown() : onNavigate(item.path)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer group relative ${
          isActive
            ? "bg-slate-900 text-white shadow-md shadow-slate-200"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        }`}
      >
        <span className={`flex-shrink-0 transition-colors duration-300 ${isActive ? "text-[#facc15]" : "text-slate-400 group-hover:text-slate-600"}`}>
          {item.icon}
        </span>
        
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-[13px] font-bold tracking-tight truncate font-sans">
              {item.text}
            </span>
            {isDropdown && (
              <span className={isActive ? "text-white/40" : "text-slate-300"}>
                {isDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            )}
          </>
        )}
      </button>

      {isDropdown && isDropdownOpen && !collapsed && (
        <div className="mt-1 ml-4 pl-3 space-y-0.5 border-l-2 border-slate-100">
          {item.children.map((sub, i) => {
            const subActive = sub.path === pathname;
            return (
              <button
                key={i}
                onClick={() => onNavigate(sub.path)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                  subActive
                    ? "text-slate-900 bg-slate-100"
                    : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {sub.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

SidebarNavItem.displayName = "SidebarNavItem";
export default SidebarNavItem;
