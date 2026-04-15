import React from "react";

const StatCard = React.memo(({ icon, title, value, color }) => {
  return (
    <div
      className="group p-5 rounded-2xl border border-slate-100 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden bg-white"
      style={{
        boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-500"
        style={{ backgroundColor: color }}
      />
      <div
        className="inline-flex p-2.5 rounded-xl mb-3 transition-colors duration-300"
        style={{
          backgroundColor: `${color}10`,
          color: color,
        }}
      >
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-900 leading-none">
        {value}
      </div>
      <div className="text-[10px] mt-1.5 font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
        {title}
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";
export default StatCard;
